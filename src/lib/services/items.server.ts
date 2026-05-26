/**
 * Server-only items fetcher. Imports DB modules — never bundle this into the
 * client.
 *
 * Strategy: DB-first, static-fallback. Returns a LoadResult that records
 * *why* we returned what we did so the UI can surface to the user when their
 * customizations weren't applied (e.g. DB cold-start timed out and we silently
 * fell back to the static bank).
 *
 * The previous shape silently fell back on any DB error. The implementer audit
 * caught that: a parent who'd customized items would see runs scored against
 * the static bank with no warning. Now `source` is explicit and callers (the
 * explore layout) propagate it to the page so we can warn.
 */
import type { PreferencesItem, ScreeningItem, StrengthsItem } from '$lib/types';
import { PREFERENCES_ITEMS } from '$lib/data/preferences-items';
import { SCREENING_ITEMS } from '$lib/data/screening-items';
import { STRENGTHS_ITEMS } from '$lib/data/strengths-items';
import { db, schema } from '$lib/db';
import { and, eq, asc, isNull } from 'drizzle-orm';
import type { ItemKind } from '$lib/schemas/items';
import type { LoadedItem } from './items-shared';

export type ItemsSource =
	| 'db' // parent has DB items, returned them
	| 'static' // no DB rows for this owner, used built-in bank (normal)
	| 'static_fallback'; // wanted DB rows but DB was unreachable — surfacing problem

export type GetItemsResult<T> = {
	items: LoadedItem<T>[];
	source: ItemsSource;
};

function staticItems(kind: ItemKind) {
	if (kind === 'preferences') return PREFERENCES_ITEMS;
	if (kind === 'screening') return SCREENING_ITEMS;
	return STRENGTHS_ITEMS;
}

type DbFetchResult =
	| { kind: 'rows'; rows: typeof schema.items.$inferSelect[] }
	| { kind: 'unreachable'; error: string };

async function dbItems(kind: ItemKind, ownerId: string | null): Promise<DbFetchResult> {
	try {
		const ownerWhere = ownerId
			? eq(schema.items.ownerId, ownerId)
			: isNull(schema.items.ownerId);
		const rows = await db()
			.select()
			.from(schema.items)
			.where(and(ownerWhere, eq(schema.items.kind, kind)))
			.orderBy(asc(schema.items.createdAt));
		return { kind: 'rows', rows };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		// Surface to server logs so cold-start / timeout patterns are auditable.
		// Vercel scoops console.error into the runtime logs panel.
		console.error('[items] DB unreachable, falling back to static bank:', message);
		return { kind: 'unreachable', error: message };
	}
}

type AnyItem = PreferencesItem | ScreeningItem | StrengthsItem;

function rowToItem(row: typeof schema.items.$inferSelect): AnyItem {
	const payload = row.payload as Record<string, unknown>;
	return { id: row.slug, ...payload } as AnyItem;
}

function asStatic<T extends AnyItem>(kind: ItemKind): LoadedItem<T>[] {
	return (staticItems(kind) as T[]).map((item) => ({
		...item,
		__source: 'static' as const,
		__itemId: null,
		__version: 0,
		__weight: 1.0
	})) as LoadedItem<T>[];
}

export async function getActiveItems(
	kind: 'preferences',
	ownerId: string | null
): Promise<GetItemsResult<PreferencesItem>>;
export async function getActiveItems(
	kind: 'screening',
	ownerId: string | null
): Promise<GetItemsResult<ScreeningItem>>;
export async function getActiveItems(
	kind: 'strengths',
	ownerId: string | null
): Promise<GetItemsResult<StrengthsItem>>;
export async function getActiveItems(
	kind: ItemKind,
	ownerId: string | null
): Promise<GetItemsResult<AnyItem>> {
	const fetch = await dbItems(kind, ownerId);

	// DB returned actual rows for this owner — they have a customized bank.
	if (fetch.kind === 'rows' && fetch.rows.length > 0) {
		const items = fetch.rows
			.filter((row) => row.active)
			.map((row) => ({
				...(rowToItem(row) as AnyItem),
				__source: 'db' as const,
				__itemId: row.id,
				__version: row.version,
				__weight: row.weight
			}));
		return { items, source: 'db' };
	}

	// DB reachable but parent has never customized this kind — normal path.
	if (fetch.kind === 'rows') {
		return { items: asStatic(kind), source: 'static' };
	}

	// DB was unreachable. If this is an anonymous visitor, static is the right
	// answer and there's nothing to warn about. If this is a signed-in parent,
	// they may have customized items they're NOT seeing — surface it.
	const source: ItemsSource = ownerId ? 'static_fallback' : 'static';
	return { items: asStatic(kind), source };
}
