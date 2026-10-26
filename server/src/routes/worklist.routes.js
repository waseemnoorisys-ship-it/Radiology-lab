import { Router } from 'express';
import {
  getWorklist,
  getWorklistStats,
  updateStudyWorkflowStatus,
} from '../controllers/worklist.controller.js';

export const worklistRouter = Router();

worklistRouter.get('/', getWorklist);
worklistRouter.get('/stats', getWorklistStats);
worklistRouter.patch('/:id/status', updateStudyWorkflowStatus);
