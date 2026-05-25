import type { PreferencesAnswer, PrefMode } from '$lib/types';
import { PREF_MODES } from '$lib/types';

export function scorePreferences(answers: PreferencesAnswer[]): Record<PrefMode, number> {
	const counts: Record<PrefMode, number> = {
		visual: 0,
		auditory: 0,
		read_write: 0,
		kinesthetic: 0
	};
	let total = 0;
	for (const a of answers) {
		for (const t of a.selectedTags) {
			counts[t] += 1;
			total += 1;
		}
	}
	if (total === 0) return counts;
	const result: Record<PrefMode, number> = {
		visual: 0,
		auditory: 0,
		read_write: 0,
		kinesthetic: 0
	};
	for (const mode of PREF_MODES) {
		result[mode] = Math.round((counts[mode] / total) * 100);
	}
	return result;
}
