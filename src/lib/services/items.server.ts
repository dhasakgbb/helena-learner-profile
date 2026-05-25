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

type DbFetchResult =
	| { kind: 'rows'; rows: typeof schema.items.$inferSelect[] }
	| { kind: 'unreachable' };

async function dbItems(kind: ItemKind, ownerId: string | null): Promise<DbFetchResult> {
	try {
		const ownerWhere = ownerId
			? eq(schema.items.ownerId, ownerId)
			: isNull(schema.items.ownerId);
		// Fetch *all* rows (active and retired) so we can distinguish two cases:
		//   - parent has never touched this kind → 0 rows → static fallback
		//   - parent has rows but retired them all → caller respects intent (empty)
		const rows = await db()
			.select()
			.from(schema.items)
			.where(and(ownerWhere, eq(schema.items.kind, kind)))
			.orderBy(asc(schema.items.createdAt));
		return { kind: 'rows', rows };
	} catch {
		return { kind: 'unreachable' };
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
	const fetch = await dbItems(kind, ownerId);
	if (fetch.kind === 'rows' && fetch.rows.length > 0) {
		// Parent has rows for this kind. Respect their intent: return only the
		// active ones (could be 0 if they retired everything — that's their call).
		return fetch.rows
			.filter((row) => row.active)
			.map((row) => ({
				...(rowToItem(row) as AnyItem),
				__source: 'db' as const,
				__itemId: row.id,
				__version: row.version,
				__weight: row.weight
			}));
	}
	// No rows at all (or DB unreachable) → static starter bank.
	return staticItems(kind).map((item) => ({
		...(item as AnyItem),
		__source: 'static' as const,
		__itemId: null,
		__version: 0,
		__weight: 1.0
	}));
}
