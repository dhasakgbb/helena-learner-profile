import { z } from 'zod';

// Allow a generous range: a child entering as old as ~20 down through the
// current school year. The upper bound is dynamic so this doesn't go stale
// every January.
const currentYear = new Date().getUTCFullYear();
export const MIN_BIRTH_YEAR = currentYear - 20;
export const MAX_BIRTH_YEAR = currentYear + 1;

export const childCreateSchema = z.object({
	display_name: z.string().trim().min(1).max(40),
	birth_year: z.number().int().min(MIN_BIRTH_YEAR).max(MAX_BIRTH_YEAR)
});

export type ChildCreate = z.infer<typeof childCreateSchema>;
