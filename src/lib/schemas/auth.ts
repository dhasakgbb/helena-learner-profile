import { z } from 'zod';

export const credentialsSchema = z.object({
	email: z.string().trim().toLowerCase().email().max(254),
	password: z.string().min(10).max(200)
});

export type Credentials = z.infer<typeof credentialsSchema>;
