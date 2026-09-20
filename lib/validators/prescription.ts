import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  strength: z.string().min(1, 'Strength is required (e.g. 5 mg)'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 1 tablet)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. Once daily)'),
  timing: z.string().min(1, 'Timing is required (e.g. After breakfast)'),
  duration: z.string().min(1, 'Duration is required (e.g. 30 days)'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  pharmacyId: z.string().min(1, 'Pharmacy selection is required'),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine is required'),
  followUpDate: z.string().optional(),
  additionalNotes: z.string().optional(),
  aiStructured: z.boolean().default(false),
});

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum([
    'CREATED',
    'SENT_TO_PHARMACY',
    'ACCEPTED',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'DISPENSED',
    'COMPLETED',
    'PARTIALLY_AVAILABLE',
    'PARTIALLY_DISPENSED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
