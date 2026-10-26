import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { mastersRouter } from './masters.routes.js';
import { patientsRouter } from './patients.routes.js';
import { examinationsRouter } from './examinations.routes.js';
import { worklistRouter } from './worklist.routes.js';
import { reportsRouter } from './reports.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/masters', mastersRouter);
apiRouter.use('/patients', patientsRouter);
apiRouter.use('/examinations', examinationsRouter);
apiRouter.use('/worklist', worklistRouter);
apiRouter.use('/reports', reportsRouter);
