import { z } from 'zod';

export const createExaminationSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  modality: z.string().min(1, 'Modality is required'),
  bodyRegion: z.string().min(1, 'Body region is required'),
  examinationCode: z.string().min(1, 'Examination code is required'),
  examinationName: z.string().min(1, 'Examination name is required'),
  laterality: z.enum(['LEFT', 'RIGHT', 'BILATERAL', 'UNILATERAL', 'NOT_APPLICABLE']).default('NOT_APPLICABLE'),
  contrast: z.enum(['WITHOUT_CONTRAST', 'WITH_CONTRAST', 'WITHOUT_AND_WITH_CONTRAST', 'NOT_APPLICABLE']).default('NOT_APPLICABLE'),
  protocol: z.string().optional(),
  clinicalIndication: z.string().optional(),
  referringDoctor: z.string().optional(),
  performingFacility: z.string().optional(),
  additionalNotes: z.string().optional(),
});
