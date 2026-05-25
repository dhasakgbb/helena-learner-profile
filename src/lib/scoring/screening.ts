import type {
	Domain,
	DomainScore,
	FlagLevel,
	ScreeningAnswer,
	ScreeningItem
} from '$lib/types';
import { DOMAINS } from '$lib/types';

const OFTEN_OR_HIGHER = 3;

function bandFromRaw(raw: number): FlagLevel {
	if (raw <= 4) return 'low';
	if (raw <= 8) return 'medium';
	return 'high';
}

function downgrade(level: FlagLevel): FlagLevel {
	if (level === 'high') return 'medium';
	if (level === 'medium') return 'low';
	return 'low';
}

export function scoreScreening(
	items: ScreeningItem[],
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
		let raw = 0;
		let parentCompleted = false;
		let parentEndorsed = false;
		for (const item of domainItems) {
			const ans = byId.get(item.id);
			if (ans?.kid !== null && ans?.kid !== undefined) raw += ans.kid;
			if (ans?.parent !== null && ans?.parent !== undefined) {
				parentCompleted = true;
				if (ans.parent >= OFTEN_OR_HIGHER) parentEndorsed = true;
			}
		}
		let level = bandFromRaw(raw);
		const needsCorroboration = !parentCompleted;
		if (parentCompleted && (level === 'medium' || level === 'high') && !parentEndorsed) {
			level = downgrade(level);
		}
		result[domain] = { level, raw, needs_corroboration: needsCorroboration };
	}
	return result;
}
