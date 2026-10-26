import { Router } from 'express';
import {
  createExamination,
  getExaminations,
  getExaminationById,
  linkLocalStudyToExamination,
} from '../controllers/examinations.controller.js';
import { uploadExaminationDicom } from '../controllers/dicom.controller.js';
import { uploadDicomFiles } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { createExaminationSchema } from '../validators/examination.validator.js';

export const examinationsRouter = Router();

examinationsRouter.get('/', getExaminations);
examinationsRouter.get('/:id', getExaminationById);
examinationsRouter.patch('/:id/local-study', linkLocalStudyToExamination);
examinationsRouter.post('/', validate({ body: createExaminationSchema }), createExamination);
examinationsRouter.post('/:id/dicom', uploadDicomFiles.array('files', 50), uploadExaminationDicom);
