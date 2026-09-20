import { z } from 'zod';

export const createOrderSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  pharmacyId: z.string().min(1, 'Pharmacy ID is required'),
  notes: z.string().optional(),

  deliveryAddress: z
    .string()
    .min(1, 'Delivery address is required'),

  contactNumber: z
    .string()
    .min(10, 'Valid contact number is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PROCESSING',
    'READY',
    'DISPENSED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusSchema
>;