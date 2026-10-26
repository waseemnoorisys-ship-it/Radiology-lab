import { Request, Response, NextFunction } from 'express';
import { ExaminationOrder } from '../models/ExaminationOrder.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { isValidDicomBuffer } from '../services/dicom/validator.js';
import { orthancService } from '../services/orthanc/orthanc.service.js';

export async function uploadExaminationDicom(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { id } = req.params;
  const files = (req.files as Express.Multer.File[]) || [];

  try {
    // 1. Validate files presence
    if (files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded. Please attach one or more .dcm DICOM files.',
      });
      return;
    }

    // 2. Find Examination Order
    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
        { accessionNumber: id },
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: `Examination order '${id}' not found in database.`,
      });
      return;
    }

    // Set processing status
    order.imageAvailability = 'UPLOADING';
    await order.save();

    // 3. Binary DICOM Validation for every file
    const validationErrors: Array<{ file: string; reason: string }> = [];
    for (const file of files) {
      const check = isValidDicomBuffer(file.buffer);
      if (!check.valid) {
        validationErrors.push({
          file: file.originalname,
          reason: check.reason || 'Not a valid DICOM Part 10 file',
        });
      }
    }

    if (validationErrors.length > 0) {
      order.imageAvailability = 'FAILED';
      await order.save();
      res.status(400).json({
        success: false,
        error: 'DICOM validation failed on one or more files',
        details: validationErrors,
      });
      return;
    }

    // 4. Upload and harmonize each DICOM instance into a unified study
    let targetStudyUid = order.studyInstanceUid;
    let targetStudyId = order.orthancStudyId;
    const targetPatientId = order.patientId;
    const targetPatientName = (order.patientName || 'ANONYMOUS').replace(/\s+/g, '^');
    const targetAccession = order.accessionNumber;
    const targetDescription = order.examinationName || 'Radiology Examination';

    const temporaryStudyIds = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // A. Initial upload
      const initial = await orthancService.uploadInstance(file.buffer);

      // B. Determine target StudyInstanceUID from existing order or first uploaded file
      if (!targetStudyUid) {
        targetStudyId = initial.ParentStudy;
        const initialStudy = await orthancService.getStudy(targetStudyId);
        targetStudyUid = initialStudy.MainDicomTags.StudyInstanceUID;
      }

      // C. Check if this instance needs unification
      // (e.g. uploaded from different test series or different StudyInstanceUID)
      const needsHarmonization = initial.ParentStudy !== targetStudyId;

      if (needsHarmonization) {
        if (initial.ParentStudy) {
          temporaryStudyIds.add(initial.ParentStudy);
        }

        // Harmonize tags so Orthanc joins it directly into the target study
        const modifiedBuf = await orthancService.modifyInstance(initial.ID, {
          StudyInstanceUID: targetStudyUid,
          PatientID: targetPatientId,
          PatientName: targetPatientName,
          AccessionNumber: targetAccession,
          StudyDescription: targetDescription,
        });

        // Delete unharmonized standalone instance
        await orthancService.deleteInstance(initial.ID);

        // Upload unified instance
        const unified = await orthancService.uploadInstance(modifiedBuf);
        targetStudyId = unified.ParentStudy;
      }
    }

    // Clean up temporary orphaned studies
    for (const tempId of temporaryStudyIds) {
      if (tempId !== targetStudyId) {
        try {
          const s = await orthancService.getStudy(tempId);
          if (!s.Series || s.Series.length === 0) {
            await orthancService.deleteStudy(tempId);
          }
        } catch {
          // Study may already have been removed
        }
      }
    }

    if (!targetStudyId || !targetStudyUid) {
      throw new Error('Orthanc accepted files but could not establish a valid unified study.');
    }

    const studyMetadata = await orthancService.getStudy(targetStudyId);
    const studyInstanceUid = targetStudyUid;

    // 6. Verify DICOMweb availability
    const dicomWebReady = await orthancService.verifyDicomWeb(studyInstanceUid);

    // Count all instances in this unified study across all series
    let totalInstances = 0;
    for (const seriesId of studyMetadata.Series) {
      try {
        const seriesRes = await fetch(`${process.env.ORTHANC_URL || 'http://127.0.0.1:8042'}/series/${encodeURIComponent(seriesId)}`);
        const seriesData = (await seriesRes.json()) as { Instances?: string[] };
        totalInstances += seriesData.Instances?.length || 0;
      } catch {
        totalInstances += 1;
      }
    }

    // 7. Update Examination Order in MongoDB
    order.orthancStudyId = targetStudyId;
    order.studyInstanceUid = studyInstanceUid;
    order.seriesCount = studyMetadata.Series.length;
    order.instanceCount = totalInstances || files.length;
    order.imageAvailability = 'AVAILABLE';
    order.workflowStatus = 'PENDING_REPORT'; // Promoted to radiologist worklist
    await order.save();

    // 8. Record Audit Event
    await AuditEvent.create({
      eventType: 'DICOM_INSTANCES_UPLOADED',
      entityType: 'EXAMINATION_ORDER',
      entityId: order.orderId,
      actor: 'Machine Operator',
      details: {
        instanceCount: files.length,
        orthancStudyId: targetStudyId,
        studyInstanceUid,
        dicomWebReady,
        patientName: studyMetadata.PatientMainDicomTags?.PatientName,
      },
    });

    res.status(200).json({
      success: true,
      message: `Successfully uploaded and archived ${files.length} DICOM instance(s).`,
      data: {
        orderId: order.orderId,
        accessionNumber: order.accessionNumber,
        orthancStudyId: order.orthancStudyId,
        studyInstanceUid: order.studyInstanceUid,
        seriesCount: order.seriesCount,
        instanceCount: order.instanceCount,
        imageAvailability: order.imageAvailability,
        workflowStatus: order.workflowStatus,
        dicomWebReady,
        ohifViewerUrl: `/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`,
      },
    });
  } catch (error) {
    console.error('[DICOM Upload Error]', error);
    try {
      await ExaminationOrder.updateOne(
        { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderId: id }] },
        { imageAvailability: 'FAILED' }
      );
    } catch {
      // Ignore fallback update errors
    }
    next(error);
  }
}
