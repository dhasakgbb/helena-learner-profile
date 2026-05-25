import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { credentialsSchema } from '$lib/schemas/auth';
import { hashPassword } from '$lib/auth/password';
import { setSessionCookie } from '$lib/auth/session';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!env.JWT_SECRET || !env.DATABASE_URL) {
		return json({ error: 'server_not_configured' }, { status: 500 });
	}
	const body = await request.json().catch(() => ({}));
	const parsed = credentialsSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'validation_failed' }, { status: 400 });
	}
	const { email, password } = parsed.data;
	const existing = await db()
		.select({ id: schema.parents.id })
		.from(schema.parents)
		.where(eq(schema.parents.email, email))
		.limit(1);
	if (existing.length > 0) {
		return json({ error: 'email_in_use' }, { status: 409 });
	}
	const hash = await hashPassword(password);
	const [created] = await db()
		.insert(schema.parents)
		.values({ email, passwordHash: hash })
		.returning({ id: schema.parents.id, email: schema.parents.email });
	if (!created) {
		return json({ error: 'insert_failed' }, { status: 500 });
	}
	await setSessionCookie(cookies, { sub: created.id, email: created.email }, env.JWT_SECRET);
	return json({ parent: { id: created.id, email: created.email } }, { status: 201 });
};
