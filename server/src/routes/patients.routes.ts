import { Router } from 'express';
import { getPatients, getPatientById, createPatient } from '../controllers/patients.controller.js';
import { validate } from '../middleware/validate.js';
import { createPatientSchema } from '../validators/patient.validator.js';

export const patientsRouter = Router();

patientsRouter.get('/', getPatients);
patientsRouter.get('/:id', getPatientById);
patientsRouter.post('/', validate({ body: createPatientSchema }), createPatient);
