import { Request, Response, NextFunction } from 'express';
import { Patient } from '../models/Patient.js';
import { AuditEvent } from '../models/AuditEvent.js';

export async function getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, limit = 20 } = req.query;
    const filter: Record<string, unknown> = {};

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ patientId: regex }, { fullName: regex }, { contactPhone: regex }];
    }

    const patients = await Patient.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const patient = await Patient.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { patientId: id }],
    });

    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientData = req.body;

    // Check uniqueness of patientId
    const existing = await Patient.findOne({ patientId: patientData.patientId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: `Patient ID '${patientData.patientId}' already exists in database`,
      });
      return;
    }

    const patient = await Patient.create(patientData);

    // Audit log
    await AuditEvent.create({
      eventType: 'PATIENT_CREATED',
      entityType: 'PATIENT',
      entityId: patient.patientId,
      actor: 'Operator',
      details: { fullName: patient.fullName, gender: patient.gender, age: patient.age },
    });

    res.status(201).json({
      success: true,
      message: 'Patient record created successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}
