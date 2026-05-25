export type PrefMode = 'visual' | 'auditory' | 'read_write' | 'kinesthetic';
export const PREF_MODES: readonly PrefMode[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];

export type Domain = 'reading' | 'writing' | 'math' | 'attention';
export const DOMAINS: readonly Domain[] = ['reading', 'writing', 'math', 'attention'];

export type FrequencyAnswer = 0 | 1 | 2 | 3 | 4;
export const FREQUENCY_LABELS = [
	'Never',
	'Rarely',
	'Sometimes',
	'Often',
	'Almost Always'
] as const;

export type LikertAnswer = 0 | 1 | 2;
export const LIKERT_LABELS = ['Not really', 'Sometimes', 'Sounds like me'] as const;

export type FlagLevel = 'low' | 'medium' | 'high';

export type Plan = 'strengths' | 'monitor' | 'schedule';

export type PreferencesItem = {
	id: string;
	prompt: string;
	options: { tag: PrefMode; text: string }[];
	multiSelect: boolean;
};

export type ScreeningItem = {
	id: string;
	domain: Domain;
	kidPrompt: string;
	parentPrompt: string;
};

export type StrengthsItem = { id: string; prompt: string };

export type PreferencesAnswer = { itemId: string; selectedTags: PrefMode[] };

export type ScreeningAnswer = {
	itemId: string;
	kid: FrequencyAnswer | null;
	parent: FrequencyAnswer | null;
};

export type StrengthsAnswer = { itemId: string; value: LikertAnswer };

export type DomainScore = {
	level: FlagLevel;
	raw: number;
	needs_corroboration: boolean;
};

export type RunPayload = {
	app_version: string;
	taken_at: string;
	preferences: PreferencesAnswer[];
	screening: ScreeningAnswer[];
	strengths: StrengthsAnswer[];
	scores: {
		preferences: Record<PrefMode, number>;
		screening: Record<Domain, DomainScore>;
		strengths_spotlight: string[];
		plan: Plan;
	};
};
