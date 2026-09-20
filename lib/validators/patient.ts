import { z } from 'zod';

export const createPatientSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(7, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  address: z.string().min(3, 'Address is required'),
  emergencyContact: z.string().min(7, 'Emergency contact phone is required'),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
