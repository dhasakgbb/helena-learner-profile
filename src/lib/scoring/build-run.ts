import type {
	Domain,
	FlagLevel,
	PreferencesAnswer,
	RunPayload,
	ScreeningAnswer,
	ScreeningItem,
	StrengthsAnswer
} from '$lib/types';
import { scorePreferences } from './preferences';
import { scoreScreening } from './screening';
import { scoreStrengths } from './strengths';
import { pickPlan } from './decision-tree';

export type BuildRunInput = {
	appVersion: string;
	screeningItems: ScreeningItem[];
	preferences: PreferencesAnswer[];
	screening: ScreeningAnswer[];
	strengths: StrengthsAnswer[];
	now?: Date;
};

export function buildRun(input: BuildRunInput): RunPayload {
	const preferencesScores = scorePreferences(input.preferences);
	const screeningScores = scoreScreening(input.screeningItems, input.screening);
	const strengthsList = scoreStrengths(input.strengths);
	const flags: Record<Domain, FlagLevel> = {
		reading: screeningScores.reading.level,
		writing: screeningScores.writing.level,
		math: screeningScores.math.level,
		attention: screeningScores.attention.level
	};
	const plan = pickPlan(flags);
	return {
		app_version: input.appVersion,
		taken_at: (input.now ?? new Date()).toISOString(),
		preferences: input.preferences,
		screening: input.screening,
		strengths: input.strengths,
		scores: {
			preferences: preferencesScores,
			screening: screeningScores,
			strengths_spotlight: strengthsList,
			plan
		}
	};
}
