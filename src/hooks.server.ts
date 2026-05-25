import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readSession } from '$lib/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	if (env.JWT_SECRET) {
		const session = await readSession(event.cookies, env.JWT_SECRET);
		event.locals.parent = session
			? { id: session.sub, email: session.email }
			: null;
	} else {
		event.locals.parent = null;
	}
	return resolve(event);
};
