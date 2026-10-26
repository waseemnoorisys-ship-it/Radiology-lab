import { ExaminationOrder } from '../models/ExaminationOrder.js';
import { Patient } from '../models/Patient.js';
import { AuditEvent } from '../models/AuditEvent.js';

function generateIdentifiers() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return {
    orderId: `ORD-${dateStr}-${randomSuffix}`,
    accessionNumber: `ACC-${dateStr}-${randomSuffix}`,
  };
}

export async function createExamination(req, res, next) {
  try {
    const payload = req.body;

    // 1. Verify Patient exists
    const patient = await Patient.findOne({ patientId: payload.patientId });
    if (!patient) {
      res.status(404).json({
        success: false,
        error: `Patient with ID '${payload.patientId}' does not exist. Please create patient record first.`,
      });
      return;
    }

    // 2. Generate unique order and accession identifiers
    let idPair = generateIdentifiers();
    let collision = await ExaminationOrder.findOne({ orderId: idPair.orderId });
    while (collision) {
      idPair = generateIdentifiers();
      collision = await ExaminationOrder.findOne({ orderId: idPair.orderId });
    }

    // 3. Assemble and create examination order record
    const order = await ExaminationOrder.create({
      orderId: idPair.orderId,
      accessionNumber: idPair.accessionNumber,
      patient: patient._id,
      patientId: patient.patientId,
      patientName: patient.fullName,
      modality: payload.modality,
      bodyRegion: payload.bodyRegion,
      examinationCode: payload.examinationCode,
      examinationName: payload.examinationName,
      laterality: payload.laterality || 'NOT_APPLICABLE',
      contrast: payload.contrast || 'NOT_APPLICABLE',
      protocol: payload.protocol || '',
      clinicalIndication: payload.clinicalIndication || '',
      referringDoctor: payload.referringDoctor || '',
      performingFacility: payload.performingFacility || 'Main Radiology Suite',
      additionalNotes: payload.additionalNotes || '',
      workflowStatus: 'PENDING_REPORT',
      imageAvailability: 'NO_IMAGES',
    });

    // 4. Record Audit Event
    await AuditEvent.create({
      eventType: 'EXAMINATION_ORDER_CREATED',
      entityType: 'EXAMINATION_ORDER',
      entityId: order.orderId,
      actor: 'Machine Operator',
      details: {
        accessionNumber: order.accessionNumber,
        patientId: order.patientId,
        modality: order.modality,
        examinationName: order.examinationName,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Examination order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExaminations(req, res, next) {
  try {
    const { patientId, modality, status, search, limit = 50, skip = 0 } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (modality) filter.modality = modality.toUpperCase();
    if (status) filter.workflowStatus = status;

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderId: regex },
        { accessionNumber: regex },
        { patientId: regex },
        { patientName: regex },
        { examinationName: regex },
      ];
    }

    const total = await ExaminationOrder.countDocuments(filter);
    const orders = await ExaminationOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExaminationById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
        { accessionNumber: id },
      ],
    }).populate('patient');

    if (!order) {
      res.status(404).json({ success: false, error: 'Examination order not found' });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function linkLocalStudyToExamination(req, res, next) {
  try {
    const { id } = req.params;
    const { studyInstanceUid, seriesCount, instanceCount, modality } = req.body;

    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
        { accessionNumber: id },
      ],
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Examination order not found' });
      return;
    }

    if (studyInstanceUid) order.studyInstanceUid = studyInstanceUid;
    if (seriesCount) order.seriesCount = seriesCount;
    if (instanceCount) order.instanceCount = instanceCount;
    if (modality) order.modality = modality;
    order.imageAvailability = 'AVAILABLE';
    if (order.workflowStatus === 'PENDING_UPLOAD') {
      order.workflowStatus = 'PENDING_REPORT';
    }

    await order.save();

    await AuditEvent.create({
      eventType: 'LOCAL_DICOM_LINKED',
      entityType: 'EXAMINATION_ORDER',
      entityId: order.orderId,
      actor: 'Radiologist',
      details: {
        studyInstanceUid: order.studyInstanceUid,
        instanceCount: order.instanceCount,
        seriesCount: order.seriesCount,
      },
    });

    res.json({
      success: true,
      message: 'Local study linked successfully without server storage.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

