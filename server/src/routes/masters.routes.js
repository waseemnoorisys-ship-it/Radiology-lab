import { Router } from 'express';
import {
  getModalities,
  getBodyRegions,
  getExaminations,
  getReportTemplates,
  getSupportingMasters,
} from '../controllers/masters.controller.js';

export const mastersRouter = Router();

mastersRouter.get('/modalities', getModalities);
mastersRouter.get('/body-regions', getBodyRegions);
mastersRouter.get('/examinations', getExaminations);
mastersRouter.get('/templates', getReportTemplates);
mastersRouter.get('/supporting', getSupportingMasters);
