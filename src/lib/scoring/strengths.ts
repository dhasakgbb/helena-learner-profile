import type { StrengthsAnswer } from '$lib/types';

export function scoreStrengths(answers: StrengthsAnswer[]): string[] {
	return answers.filter((a) => a.value === 2).map((a) => a.itemId);
}
