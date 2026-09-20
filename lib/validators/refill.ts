import { z } from 'zod';

export const createRefillSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  reason: z.string().optional(),
});

export const respondRefillSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CONSULTATION_REQUESTED']),
  doctorNotes: z.string().optional(),
});

export type CreateRefillInput = z.infer<typeof createRefillSchema>;
export type RespondRefillInput = z.infer<typeof respondRefillSchema>;
