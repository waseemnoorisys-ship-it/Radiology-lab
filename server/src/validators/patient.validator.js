import { z } from 'zod';

export const createPatientSchema = z.object({
  patientId: z.string().min(2, 'Patient ID must be at least 2 characters').trim(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  dateOfBirth: z.string().optional().transform(val => (val ? new Date(val) : undefined)),
  age: z.number().int().min(0).max(130).optional(),
  gender: z.enum(['M', 'F', 'O', 'UNKNOWN']).default('UNKNOWN'),
  contactPhone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
});

export const searchPatientSchema = z.object({
  search: z.string().optional(),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 20)),
});
