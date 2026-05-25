import type { Domain, FlagLevel, Plan } from '$lib/types';

export function pickPlan(flags: Record<Domain, FlagLevel>): Plan {
	const levels = Object.values(flags);
	const highCount = levels.filter((l) => l === 'high').length;
	const mediumCount = levels.filter((l) => l === 'medium').length;
	if (highCount >= 1) return 'schedule';
	if (mediumCount >= 2) return 'schedule';
	if (mediumCount === 1) return 'monitor';
	return 'strengths';
}
