import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import { db, schema } from '$lib/db';
import { and, eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const id = event.params.id;
	if (!id) return json({ error: 'id_required' }, { status: 400 });
	const [row] = await db()
		.select({
			id: schema.runs.id,
			taken_at: schema.runs.takenAt,
			payload: schema.runs.payload,
			app_version: schema.runs.appVersion,
			childId: schema.runs.childId
		})
		.from(schema.runs)
		.innerJoin(schema.children, eq(schema.children.id, schema.runs.childId))
		.where(and(eq(schema.runs.id, id), eq(schema.children.parentId, parent.id)))
		.limit(1);
	if (!row) return json({ error: 'not_found' }, { status: 404 });
	return json({ run: row });
};

export const DELETE: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const id = event.params.id;
	if (!id) return json({ error: 'id_required' }, { status: 400 });
	const [row] = await db()
		.select({ id: schema.runs.id })
		.from(schema.runs)
		.innerJoin(schema.children, eq(schema.children.id, schema.runs.childId))
		.where(and(eq(schema.runs.id, id), eq(schema.children.parentId, parent.id)))
		.limit(1);
	if (!row) return json({ error: 'not_found' }, { status: 404 });
	await db().delete(schema.runs).where(eq(schema.runs.id, id));
	return new Response(null, { status: 204 });
};
