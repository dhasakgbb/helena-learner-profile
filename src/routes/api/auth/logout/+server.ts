import { type RequestHandler } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	clearSessionCookie(cookies);
	return new Response(null, { status: 204 });
};
