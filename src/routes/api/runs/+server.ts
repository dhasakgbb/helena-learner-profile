import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import { saveRunRequestSchema } from '$lib/schemas/runs';
import { parseUuid } from '$lib/schemas/util';
import { db, schema } from '$lib/db';
import { and, desc, eq } from 'drizzle-orm';
import type { RunPayload } from '$lib/types';

export const POST: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const body = await event.request.json().catch(() => ({}));
	const parsed = saveRunRequestSchema.safeParse(body);
	if (!parsed.success) return json({ error: 'validation_failed' }, { status: 400 });
	const { child_id, payload, item_versions } = parsed.data;
	const [child] = await db()
		.select({ id: schema.children.id })
		.from(schema.children)
		.where(and(eq(schema.children.id, child_id), eq(schema.children.parentId, parent.id)))
		.limit(1);
	if (!child) return json({ error: 'child_not_found' }, { status: 404 });
	const [row] = await db()
		.insert(schema.runs)
		.values({
			childId: child_id,
			payload: payload,
			appVersion: payload.app_version,
			itemVersions: item_versions ?? null
		})
		.returning({ id: schema.runs.id, taken_at: schema.runs.takenAt });
	return json({ run: row }, { status: 201 });
};

export const GET: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const childId = parseUuid(event.url.searchParams.get('child_id'));
	if (!childId) return json({ error: 'child_id_required' }, { status: 400 });
	const [child] = await db()
		.select({ id: schema.children.id })
		.from(schema.children)
		.where(and(eq(schema.children.id, childId), eq(schema.children.parentId, parent.id)))
		.limit(1);
	if (!child) return json({ error: 'child_not_found' }, { status: 404 });
	const rows = await db()
		.select({
			id: schema.runs.id,
			taken_at: schema.runs.takenAt,
			app_version: schema.runs.appVersion,
			payload: schema.runs.payload
		})
		.from(schema.runs)
		.where(eq(schema.runs.childId, childId))
		.orderBy(desc(schema.runs.takenAt));
	const summary = rows.map((r) => {
		const payload = r.payload as RunPayload;
		return {
			id: r.id,
			taken_at: r.taken_at,
			app_version: r.app_version,
			plan: payload.scores?.plan ?? 'strengths',
			screening_levels: payload.scores?.screening
		};
	});
	return json({ runs: summary });
};
