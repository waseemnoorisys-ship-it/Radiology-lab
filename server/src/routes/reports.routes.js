import { Router } from 'express';
import {
  getReportByOrderId,
  getReportById,
  saveDraftReport,
  finalizeReport,
  downloadReportPdf,
} from '../controllers/reports.controller.js';

export const reportsRouter = Router();

reportsRouter.get('/order/:orderId', getReportByOrderId);
reportsRouter.get('/order/:orderId/pdf', downloadReportPdf);
reportsRouter.get('/:id', getReportById);
reportsRouter.post('/order/:orderId/draft', saveDraftReport);
reportsRouter.post('/order/:orderId/finalize', finalizeReport);
