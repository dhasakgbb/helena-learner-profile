/**
 * Client-safe helpers that touch only loaded item objects, never the DB.
 * The server-side fetch lives in items.server.ts.
 */
import type { PreferencesItem, ScreeningItem, StrengthsItem } from '$lib/types';

export type LoadedItem<T> = T & {
	__source: 'static' | 'db';
	__itemId: string | null;
	__version: number;
	__weight: number;
};

type AnyItem = PreferencesItem | ScreeningItem | strengthsItem;
type strengthsItem = StrengthsItem;

/**
 * Compute the version map written into runs.item_versions so historic runs
 * can be re-rendered against the items that were in use when they were taken,
 * even after edits.
 */
export function snapshotVersions<T extends LoadedItem<AnyItem>>(
	items: T[]
): Record<string, { id: string | null; version: number }> {
	const map: Record<string, { id: string | null; version: number }> = {};
	for (const it of items) {
		const slug = (it as AnyItem).id;
		map[slug] = { id: it.__itemId, version: it.__version };
	}
	return map;
}
