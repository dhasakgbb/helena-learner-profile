import { z } from 'zod';

export const childCreateSchema = z.object({
	display_name: z.string().trim().min(1).max(40),
	birth_year: z.number().int().min(2005).max(2025)
});

export type ChildCreate = z.infer<typeof childCreateSchema>;
