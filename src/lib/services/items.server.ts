/**
 * Server-only items fetcher. Imports DB modules — never bundle this into the
 * client.
 *
 * Strategy: DB-first, static-fallback. For a given parent (owner), if they
 * have any active items of `kind` in the DB, use those. Otherwise fall back
 * to the static built-in bank. This keeps the kid flow working in three
 * scenarios:
 *
 *  - parent never signed in (owner=null, no DB rows) → static
 *  - parent signed in but hasn't customized yet → static
 *  - DB unreachable → static (best-effort try/catch)
 */
import type { PreferencesItem, ScreeningItem, StrengthsItem } from '$lib/types';
import { PREFERENCES_ITEMS } from '$lib/data/preferences-items';
import { SCREENING_ITEMS } from '$lib/data/screening-items';
import { STRENGTHS_ITEMS } from '$lib/data/strengths-items';
import { db, schema } from '$lib/db';
import { and, eq, asc, isNull } from 'drizzle-orm';
import type { ItemKind } from '$lib/schemas/items';
import type { LoadedItem } from './items-shared';

function staticItems(kind: ItemKind) {
	if (kind === 'preferences') return PREFERENCES_ITEMS;
	if (kind === 'screening') return SCREENING_ITEMS;
	return STRENGTHS_ITEMS;
}

async function dbItems(
	kind: ItemKind,
	ownerId: string | null
): Promise<typeof schema.items.$inferSelect[] | null> {
	try {
		const where = ownerId
			? and(
					eq(schema.items.ownerId, ownerId),
					eq(schema.items.kind, kind),
					eq(schema.items.active, true)
				)
			: and(
					isNull(schema.items.ownerId),
					eq(schema.items.kind, kind),
					eq(schema.items.active, true)
				);
		const rows = await db()
			.select()
			.from(schema.items)
			.where(where)
			.orderBy(asc(schema.items.createdAt));
		return rows;
	} catch {
		return null;
	}
}

type AnyItem = PreferencesItem | ScreeningItem | StrengthsItem;

function rowToItem(row: typeof schema.items.$inferSelect): AnyItem {
	const payload = row.payload as Record<string, unknown>;
	return { id: row.slug, ...payload } as AnyItem;
}

export async function getActiveItems(
	kind: 'preferences',
	ownerId: string | null
): Promise<LoadedItem<PreferencesItem>[]>;
export async function getActiveItems(
	kind: 'screening',
	ownerId: string | null
): Promise<LoadedItem<ScreeningItem>[]>;
export async function getActiveItems(
	kind: 'strengths',
	ownerId: string | null
): Promise<LoadedItem<StrengthsItem>[]>;
export async function getActiveItems(
	kind: ItemKind,
	ownerId: string | null
): Promise<LoadedItem<AnyItem>[]> {
	const rows = await dbItems(kind, ownerId);
	if (rows && rows.length > 0) {
		return rows.map((row) => ({
			...(rowToItem(row) as AnyItem),
			__source: 'db' as const,
			__itemId: row.id,
			__version: row.version,
			__weight: row.weight
		}));
	}
	return staticItems(kind).map((item) => ({
		...(item as AnyItem),
		__source: 'static' as const,
		__itemId: null,
		__version: 0,
		__weight: 1.0
	}));
}
