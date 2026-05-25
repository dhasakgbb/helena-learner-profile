import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.parent) return json({ error: 'unauthorized' }, { status: 401 });
	return json({ parent: locals.parent });
};
