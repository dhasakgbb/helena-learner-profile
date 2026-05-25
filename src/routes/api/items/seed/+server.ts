/**
 * One-shot seed endpoint. Imports the built-in static item bank as version 1
 * for the signed-in parent. Idempotent: if the parent already has items of a
 * given kind, that kind is skipped (so calling twice doesn't duplicate).
 *
 * Use case: parent signs up, hits "import starter items" on the items page,
 * and from then on owns an editable copy of the v1 bank.
 */
import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import { db, schema } from '$lib/db';
import { and, eq } from 'drizzle-orm';
import { PREFERENCES_ITEMS } from '$lib/data/preferences-items';
import { SCREENING_ITEMS } from '$lib/data/screening-items';
import { STRENGTHS_ITEMS } from '$lib/data/strengths-items';
import type { ItemKind } from '$lib/schemas/items';

async function hasAny(parentId: string, kind: ItemKind): Promise<boolean> {
	const rows = await db()
		.select({ id: schema.items.id })
		.from(schema.items)
		.where(and(eq(schema.items.ownerId, parentId), eq(schema.items.kind, kind)))
		.limit(1);
	return rows.length > 0;
}

export const POST: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const inserted: Record<string, number> = { preferences: 0, screening: 0, strengths: 0 };

	if (!(await hasAny(parent.id, 'preferences'))) {
		const rows = PREFERENCES_ITEMS.map((item) => ({
			ownerId: parent.id,
			kind: 'preferences',
			slug: item.id,
			version: 1,
			payload: {
				prompt: item.prompt,
				multiSelect: item.multiSelect,
				options: item.options
			},
			active: true,
			weight: 1.0
		}));
		await db().insert(schema.items).values(rows);
		inserted.preferences = rows.length;
	}

	if (!(await hasAny(parent.id, 'screening'))) {
		const rows = SCREENING_ITEMS.map((item) => ({
			ownerId: parent.id,
			kind: 'screening',
			slug: item.id,
			version: 1,
			payload: {
				domain: item.domain,
				kidPrompt: item.kidPrompt,
				parentPrompt: item.parentPrompt
			},
			active: true,
			weight: 1.0
		}));
		await db().insert(schema.items).values(rows);
		inserted.screening = rows.length;
	}

	if (!(await hasAny(parent.id, 'strengths'))) {
		const rows = STRENGTHS_ITEMS.map((item) => ({
			ownerId: parent.id,
			kind: 'strengths',
			slug: item.id,
			version: 1,
			payload: { prompt: item.prompt },
			active: true,
			weight: 1.0
		}));
		await db().insert(schema.items).values(rows);
		inserted.strengths = rows.length;
	}

	return json({ inserted }, { status: 200 });
};
