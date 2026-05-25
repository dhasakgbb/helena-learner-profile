import { z } from 'zod';

/** Reusable UUID schema for path / query params. */
export const uuidParam = z.string().uuid();

/** Return parsed UUID or null. Callers should treat null as "respond 400". */
export function parseUuid(input: string | null | undefined): string | null {
	if (!input) return null;
	const result = uuidParam.safeParse(input);
	return result.success ? result.data : null;
}
