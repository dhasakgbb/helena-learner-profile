import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { signSession, verifySession, type SessionClaims } from './jwt';

export const SESSION_COOKIE = 'session';

export async function setSessionCookie(
	cookies: Cookies,
	claims: SessionClaims,
	jwtSecret: string
) {
	const token = await signSession(claims, jwtSecret);
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 7
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function readSession(
	cookies: Cookies,
	jwtSecret: string
): Promise<SessionClaims | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	try {
		return await verifySession(token, jwtSecret);
	} catch {
		return null;
	}
}

export function requireParent(event: RequestEvent) {
	const parent = event.locals.parent;
	if (!parent) {
		throw error(401, { message: 'Unauthorized' });
	}
	return parent;
}
