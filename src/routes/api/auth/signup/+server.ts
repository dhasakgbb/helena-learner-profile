import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { credentialsSchema } from '$lib/schemas/auth';
import { hashPassword } from '$lib/auth/password';
import { setSessionCookie } from '$lib/auth/session';
import { checkRateLimit } from '$lib/auth/rate-limit';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	if (!env.JWT_SECRET || !env.DATABASE_URL) {
		return json({ error: 'server_not_configured' }, { status: 500 });
	}
	const ip = getClientAddress();
	const limit = checkRateLimit(`signup:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 });
	if (!limit.allowed) {
		return json(
			{ error: 'rate_limited', retry_after_seconds: limit.retryAfterSeconds },
			{ status: 429 }
		);
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
	let created;
	try {
		[created] = await db()
			.insert(schema.parents)
			.values({ email, passwordHash: hash })
			.returning({ id: schema.parents.id, email: schema.parents.email });
	} catch (err) {
		// If a race squeezed past the existence check, the UNIQUE email
		// constraint fires as Postgres SQLSTATE 23505. Treat the same as
		// the pre-check 409 so callers can retry deterministically.
		const code = (err as { code?: string }).code;
		if (code === '23505') {
			return json({ error: 'email_in_use' }, { status: 409 });
		}
		throw err;
	}
	if (!created) {
		return json({ error: 'insert_failed' }, { status: 500 });
	}
	await setSessionCookie(cookies, { sub: created.id, email: created.email }, env.JWT_SECRET);
	return json({ parent: { id: created.id, email: created.email } }, { status: 201 });
};
