import { Report } from '../models/Report.js';
import { ExaminationOrder } from '../models/ExaminationOrder.js';
import { ReportTemplate } from '../models/ReportTemplate.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { radiologyPdfGenerator } from '../services/pdf/pdfGenerator.js';

function generateReportId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `REP-${dateStr}-${randomSuffix}`;
}

export async function getReportByOrderId(req, res, next) {
  try {
    const { orderId } = req.params;

    // Find order first
    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderId },
        { accessionNumber: orderId },
      ],
    }).populate('patient');

    if (!order) {
      res.status(404).json({ success: false, error: `Examination order '${orderId}' not found.` });
      return;
    }

    // Find associated report
    let report = await Report.findOne({ orderId: order.orderId });

    // Find applicable template
    let template = null;
    if (order.examinationCode) {
      template = await ReportTemplate.findOne({
        applicableExaminations: order.examinationCode,
        isActive: true,
      });
    }
    if (!template) {
      template = await ReportTemplate.findOne({
        modalityCode: order.modality,
        isActive: true,
      });
    }

    res.json({
      success: true,
      data: {
        order,
        report,
        template,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportById(req, res, next) {
  try {
    const { id } = req.params;
    const report = await Report.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { reportId: id },
      ],
    }).populate('examination patient');

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function saveDraftReport(req, res, next) {
  try {
    const { orderId } = req.params;
    const payload = req.body;

    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderId },
        { accessionNumber: orderId },
      ],
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Examination order not found.' });
      return;
    }

    let report = await Report.findOne({ orderId: order.orderId });

    if (!report) {
      // Create new draft report
      report = new Report({
        reportId: generateReportId(),
        examination: order._id,
        orderId: order.orderId,
        accessionNumber: order.accessionNumber,
        patient: order.patient,
        patientId: order.patientId,
        patientName: order.patientName,
        modality: order.modality,
        examinationName: order.examinationName,
        templateCode: payload.templateCode || 'CUSTOM',
        templateVersion: payload.templateVersion || 1,
        status: 'DRAFT',
        radiologist: payload.radiologist || {
          name: 'Dr. Gregory House, MD',
          licenseNumber: 'RAD-98234',
          role: 'Staff Radiologist',
        },
        sections: payload.sections || [],
        findings: payload.findings || '',
        impression: payload.impression || '',
        recommendations: payload.recommendations || '',
        technique: payload.technique || order.protocol || '',
        comparison: payload.comparison || '',
        criticalResultsNotified: payload.criticalResultsNotified || false,
        criticalNotificationDetails: payload.criticalNotificationDetails || '',
      });
    } else {
      // Update existing draft
      if (report.status === 'FINALIZED') {
        res.status(400).json({
          success: false,
          error: 'This report is already finalized. To modify it, please submit an amendment.',
        });
        return;
      }

      report.sections = payload.sections || report.sections;
      report.findings = payload.findings !== undefined ? payload.findings : report.findings;
      report.impression = payload.impression !== undefined ? payload.impression : report.impression;
      report.recommendations = payload.recommendations !== undefined ? payload.recommendations : report.recommendations;
      report.technique = payload.technique !== undefined ? payload.technique : report.technique;
      report.comparison = payload.comparison !== undefined ? payload.comparison : report.comparison;
      report.criticalResultsNotified = payload.criticalResultsNotified !== undefined ? payload.criticalResultsNotified : report.criticalResultsNotified;
      report.criticalNotificationDetails = payload.criticalNotificationDetails !== undefined ? payload.criticalNotificationDetails : report.criticalNotificationDetails;
      if (payload.radiologist) {
        report.radiologist = payload.radiologist;
      }
    }

    await report.save();

    // Link report to order & update status
    order.report = report._id;
    order.workflowStatus = 'DRAFT_SAVED';
    await order.save();

    // Audit Event
    await AuditEvent.create({
      eventType: 'REPORT_DRAFT_SAVED',
      entityType: 'REPORT',
      entityId: report.reportId,
      actor: report.radiologist.name,
      details: {
        orderId: order.orderId,
        accessionNumber: order.accessionNumber,
        version: report.version,
      },
    });

    res.json({
      success: true,
      message: 'Draft report saved successfully.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function finalizeReport(req, res, next) {
  try {
    const { orderId } = req.params;
    const payload = req.body;

    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderId },
        { accessionNumber: orderId },
      ],
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Examination order not found.' });
      return;
    }

    // 1. Validation checks
    if (!payload.impression || typeof payload.impression !== 'string' || payload.impression.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Clinical Impression / Conclusion is required before finalization.',
      });
      return;
    }

    const radiologistName = payload.radiologist?.name || 'Dr. Gregory House, MD';

    let report = await Report.findOne({ orderId: order.orderId });

    if (!report) {
      report = new Report({
        reportId: generateReportId(),
        examination: order._id,
        orderId: order.orderId,
        accessionNumber: order.accessionNumber,
        patient: order.patient,
        patientId: order.patientId,
        patientName: order.patientName,
        modality: order.modality,
        examinationName: order.examinationName,
        templateCode: payload.templateCode || 'CUSTOM',
        templateVersion: payload.templateVersion || 1,
        status: 'FINALIZED',
        radiologist: payload.radiologist || {
          name: radiologistName,
          licenseNumber: 'RAD-98234',
          role: 'Staff Radiologist',
        },
        sections: payload.sections || [],
        findings: payload.findings || '',
        impression: payload.impression,
        recommendations: payload.recommendations || '',
        technique: payload.technique || order.protocol || '',
        comparison: payload.comparison || '',
        criticalResultsNotified: payload.criticalResultsNotified || false,
        criticalNotificationDetails: payload.criticalNotificationDetails || '',
        finalizedAt: new Date(),
        finalizedBy: radiologistName,
        version: 1,
      });
    } else {
      // Check if this is an amendment to an already finalized report
      if (report.status === 'FINALIZED' || report.status === 'AMENDED') {
        const amendmentReason = payload.amendmentReason;
        if (!amendmentReason || amendmentReason.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: 'An amendment reason is required when modifying a finalized report.',
          });
          return;
        }

        // Store previous content in amendment history
        report.amendmentHistory.push({
          version: report.version,
          amendedAt: new Date(),
          amendedBy: radiologistName,
          reason: amendmentReason,
          previousContent: {
            sections: report.sections,
            findings: report.findings,
            impression: report.impression,
            recommendations: report.recommendations,
          },
        });

        report.version += 1;
        report.status = 'AMENDED';
      } else {
        report.status = 'FINALIZED';
      }

      report.sections = payload.sections || report.sections;
      report.findings = payload.findings || report.findings;
      report.impression = payload.impression;
      report.recommendations = payload.recommendations || report.recommendations;
      report.technique = payload.technique || report.technique;
      report.comparison = payload.comparison || report.comparison;
      report.criticalResultsNotified = payload.criticalResultsNotified || false;
      report.criticalNotificationDetails = payload.criticalNotificationDetails || '';
      report.finalizedAt = new Date();
      report.finalizedBy = radiologistName;
      if (payload.radiologist) {
        report.radiologist = payload.radiologist;
      }
    }

    await report.save();

    // Update order status to FINALIZED
    order.report = report._id;
    order.workflowStatus = 'FINALIZED';
    await order.save();

    // Audit Event
    await AuditEvent.create({
      eventType: report.status === 'AMENDED' ? 'REPORT_AMENDED' : 'REPORT_FINALIZED',
      entityType: 'REPORT',
      entityId: report.reportId,
      actor: radiologistName,
      details: {
        orderId: order.orderId,
        accessionNumber: order.accessionNumber,
        version: report.version,
        status: report.status,
      },
    });

    res.json({
      success: true,
      message: `Report ${report.reportId} successfully finalized (v${report.version}).`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadReportPdf(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderId },
        { accessionNumber: orderId },
      ],
    }).populate('patient');

    if (!order) {
      res.status(404).json({ success: false, error: 'Examination order not found.' });
      return;
    }

    const report = await Report.findOne({ orderId: order.orderId });
    if (!report) {
      res.status(404).json({
        success: false,
        error: 'No report has been drafted or finalized for this examination yet.',
      });
      return;
    }

    // Generate binary PDF
    const pdfBuffer = radiologyPdfGenerator.generateReportPdf(report, order);

    // Set download headers
    const filename = `Report_${order.accessionNumber}_v${report.version}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Audit PDF download event
    await AuditEvent.create({
      eventType: 'REPORT_PDF_DOWNLOADED',
      entityType: 'REPORT',
      entityId: report.reportId,
      actor: req.query.user || 'Authorized Clinician',
      details: {
        orderId: order.orderId,
        accessionNumber: order.accessionNumber,
        version: report.version,
      },
    });

    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
