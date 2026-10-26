import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let orthancStatus = 'unknown';
  let orthancInfo = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${env.ORTHANC_URL}/system`, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      orthancStatus = 'connected';
      const data = (await response.json()) as Record<string, unknown>;
      orthancInfo = {
        name: data.Name,
        version: data.Version,
        dicomAet: data.DicomAet,
        dicomPort: data.DicomPort,
        httpPort: data.HttpPort,
      };
    } else {
      orthancStatus = `error (HTTP ${response.status})`;
    }
  } catch (error: unknown) {
    orthancStatus = `unreachable (${(error as Error).message})`;
  }

  const isHealthy = mongoStatus === 'connected' && orthancStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      api: 'healthy',
      database: {
        status: mongoStatus,
        name: mongoose.connection.name,
      },
      orthanc: {
        status: orthancStatus,
        url: env.ORTHANC_URL,
        info: orthancInfo,
      },
    },
  });
});
