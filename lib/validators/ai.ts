import { z } from 'zod';

export const aiStructureSchema = z.object({
  naturalLanguage: z
    .string()
    .min(5, 'Instructions must be at least 5 characters long'),
});

export type AIStructureInput = z.infer<typeof aiStructureSchema>;
