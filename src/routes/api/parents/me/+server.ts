import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { requireParent, clearSessionCookie } from '$lib/auth/session';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

const deleteSchema = z.object({ confirm_email: z.string().trim().toLowerCase().email() });

export const DELETE: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const body = await event.request.json().catch(() => ({}));
	const parsed = deleteSchema.safeParse(body);
	if (!parsed.success || parsed.data.confirm_email !== parent.email) {
		return json({ error: 'confirm_email_mismatch' }, { status: 400 });
	}
	await db().delete(schema.parents).where(eq(schema.parents.id, parent.id));
	clearSessionCookie(event.cookies);
	return new Response(null, { status: 204 });
};
