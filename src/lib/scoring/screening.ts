import type {
	Domain,
	DomainScore,
	FlagLevel,
	ScreeningAnswer,
	ScreeningItem
} from '$lib/types';
import { DOMAINS } from '$lib/types';

const OFTEN_OR_HIGHER = 3;
const MAX_PER_ITEM = 4;
const BAND_MEDIUM_MIN = 1 / 3; // > 33%
const BAND_HIGH_MIN = 2 / 3; // > 67%

/**
 * Items may carry a `weight` (0..N) when loaded from the DB-backed bank.
 * For static items the weight is implicitly 1.0. A weight of 0 lets a parent
 * mute an item without retiring it. Bands are computed from the weighted
 * percentage so that custom weights don't drift the meaning of "medium" vs
 * "high" relative to what the rest of the items contribute.
 */
type Weighted = ScreeningItem & { weight?: number };

function effectiveWeight(item: Weighted): number {
	if (typeof item.weight !== 'number' || !isFinite(item.weight)) return 1;
	if (item.weight < 0) return 0;
	return item.weight;
}

function bandFromPercent(pct: number): FlagLevel {
	if (pct >= BAND_HIGH_MIN) return 'high';
	if (pct >= BAND_MEDIUM_MIN) return 'medium';
	return 'low';
}

function downgrade(level: FlagLevel): FlagLevel {
	if (level === 'high') return 'medium';
	if (level === 'medium') return 'low';
	return 'low';
}

export function scoreScreening(
	items: Weighted[],
	answers: ScreeningAnswer[]
): Record<Domain, DomainScore> {
	const byId = new Map(answers.map((a) => [a.itemId, a]));
	const result: Record<Domain, DomainScore> = {
		reading: { level: 'low', raw: 0, needs_corroboration: false },
		writing: { level: 'low', raw: 0, needs_corroboration: false },
		math: { level: 'low', raw: 0, needs_corroboration: false },
		attention: { level: 'low', raw: 0, needs_corroboration: false }
	};
	for (const domain of DOMAINS) {
		const domainItems = items.filter((i) => i.domain === domain);
		let weightedSum = 0;
		let weightedMax = 0;
		let rawSum = 0;
		let parentCompleted = false;
		let parentEndorsed = false;
		for (const item of domainItems) {
			const w = effectiveWeight(item);
			weightedMax += w * MAX_PER_ITEM;
			const ans = byId.get(item.id);
			if (ans?.kid !== null && ans?.kid !== undefined) {
				weightedSum += w * ans.kid;
				rawSum += ans.kid;
			}
			if (ans?.parent !== null && ans?.parent !== undefined) {
				parentCompleted = true;
				if (ans.parent >= OFTEN_OR_HIGHER) parentEndorsed = true;
			}
		}
		// If every item is weight=0, treat as low + needs_corroboration true —
		// there's nothing meaningful to flag.
		const pct = weightedMax > 0 ? weightedSum / weightedMax : 0;
		let level = bandFromPercent(pct);
		const needsCorroboration = !parentCompleted;
		if (parentCompleted && (level === 'medium' || level === 'high') && !parentEndorsed) {
			level = downgrade(level);
		}
		// `raw` is kept as the un-weighted kid sum so it remains a stable signal
		// for the UI (max 12 for the default 3-item domain), but bands derive
		// from the weighted percentage.
		result[domain] = { level, raw: rawSum, needs_corroboration: needsCorroboration };
	}
	return result;
}
