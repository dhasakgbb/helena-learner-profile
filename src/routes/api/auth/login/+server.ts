import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { credentialsSchema } from '$lib/schemas/auth';
import { verifyPassword } from '$lib/auth/password';
import { setSessionCookie } from '$lib/auth/session';
import { checkRateLimit } from '$lib/auth/rate-limit';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	if (!env.JWT_SECRET || !env.DATABASE_URL) {
		return json({ error: 'server_not_configured' }, { status: 500 });
	}
	const ip = getClientAddress();
	const limit = checkRateLimit(`login:${ip}`);
	if (!limit.allowed) {
		return json(
			{ error: 'rate_limited', retry_after_seconds: limit.retryAfterSeconds },
			{ status: 429 }
		);
	}
	const body = await request.json().catch(() => ({}));
	const parsed = credentialsSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'invalid_credentials' }, { status: 401 });
	}
	const { email, password } = parsed.data;
	const [row] = await db()
		.select({
			id: schema.parents.id,
			email: schema.parents.email,
			passwordHash: schema.parents.passwordHash
		})
		.from(schema.parents)
		.where(eq(schema.parents.email, email))
		.limit(1);
	if (!row) {
		await verifyPassword(password, '$2b$12$0000000000000000000000.00000000000000000000000000000000');
		return json({ error: 'invalid_credentials' }, { status: 401 });
	}
	const ok = await verifyPassword(password, row.passwordHash);
	if (!ok) {
		return json({ error: 'invalid_credentials' }, { status: 401 });
	}
	await setSessionCookie(cookies, { sub: row.id, email: row.email }, env.JWT_SECRET);
	return json({ parent: { id: row.id, email: row.email } }, { status: 200 });
};
