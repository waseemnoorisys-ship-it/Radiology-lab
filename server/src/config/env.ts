import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/radiology_lab'),
  ORTHANC_URL: z.string().default('http://127.0.0.1:8042'),
  ORTHANC_USERNAME: z.string().optional().default(''),
  ORTHANC_PASSWORD: z.string().optional().default(''),
  ORTHANC_DICOMWEB_ROOT: z.string().default('/dicom-web/'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
