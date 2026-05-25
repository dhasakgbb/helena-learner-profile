import type {
	PreferencesAnswer,
	PrefMode,
	ScreeningAnswer,
	StrengthsAnswer,
	FrequencyAnswer,
	LikertAnswer
} from '$lib/types';

const STORAGE_KEY = 'helena-explore-state-v1';

type ExploreState = {
	disclaimerAcked: boolean;
	parentViewRequested: boolean;
	resumeAcknowledged: boolean;
	preferences: PreferencesAnswer[];
	screening: ScreeningAnswer[];
	strengths: StrengthsAnswer[];
};

function blank(): ExploreState {
	return {
		disclaimerAcked: false,
		parentViewRequested: false,
		resumeAcknowledged: false,
		preferences: [],
		screening: [],
		strengths: []
	};
}

function loadFromStorage(): ExploreState {
	if (typeof window === 'undefined') return blank();
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return blank();
		const parsed = JSON.parse(raw);
		return {
			disclaimerAcked: !!parsed.disclaimerAcked,
			parentViewRequested: !!parsed.parentViewRequested,
			resumeAcknowledged: !!parsed.resumeAcknowledged,
			preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
			screening: Array.isArray(parsed.screening) ? parsed.screening : [],
			strengths: Array.isArray(parsed.strengths) ? parsed.strengths : []
		};
	} catch {
		return blank();
	}
}

function persist(state: ExploreState) {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// quota or private mode — silently skip
	}
}

function createStore() {
	const initial = loadFromStorage();
	const startedWithProgress =
		initial.preferences.length > 0 ||
		initial.screening.length > 0 ||
		initial.strengths.length > 0;

	let disclaimerAcked = $state(initial.disclaimerAcked);
	let parentViewRequested = $state(initial.parentViewRequested);
	let resumeAcknowledged = $state(initial.resumeAcknowledged);
	let preferences = $state<PreferencesAnswer[]>(initial.preferences);
	let screening = $state<ScreeningAnswer[]>(initial.screening);
	let strengths = $state<StrengthsAnswer[]>(initial.strengths);
	// Only show the resume prompt when state was actually loaded AND the user
	// hasn't already dismissed it for this session. Without persisting the
	// dismissal, every reload would re-prompt the user.
	let resumePromptPending = $state(startedWithProgress && !initial.resumeAcknowledged);

	function snapshot(): ExploreState {
		return {
			disclaimerAcked,
			parentViewRequested,
			resumeAcknowledged,
			preferences: $state.snapshot(preferences),
			screening: $state.snapshot(screening),
			strengths: $state.snapshot(strengths)
		};
	}

	return {
		get disclaimerAcked() {
			return disclaimerAcked;
		},
		set disclaimerAcked(v: boolean) {
			disclaimerAcked = v;
			persist(snapshot());
		},
		get parentViewRequested() {
			return parentViewRequested;
		},
		set parentViewRequested(v: boolean) {
			parentViewRequested = v;
			persist(snapshot());
		},
		get preferences() {
			return preferences;
		},
		setPreference(itemId: string, selectedTags: PrefMode[]) {
			const existing = preferences.findIndex((a) => a.itemId === itemId);
			if (existing >= 0) preferences[existing] = { itemId, selectedTags };
			else preferences.push({ itemId, selectedTags });
			persist(snapshot());
		},
		get screening() {
			return screening;
		},
		setScreening(
			itemId: string,
			view: 'kid' | 'parent',
			value: FrequencyAnswer | null
		) {
			let row = screening.find((a) => a.itemId === itemId);
			if (!row) {
				row = { itemId, kid: null, parent: null };
				screening.push(row);
			}
			if (view === 'kid') row.kid = value;
			else row.parent = value;
			persist(snapshot());
		},
		get strengths() {
			return strengths;
		},
		setStrength(itemId: string, value: LikertAnswer) {
			const existing = strengths.findIndex((a) => a.itemId === itemId);
			if (existing >= 0) strengths[existing] = { itemId, value };
			else strengths.push({ itemId, value });
			persist(snapshot());
		},
		hasInProgress() {
			return (
				preferences.length > 0 || screening.length > 0 || strengths.length > 0
			);
		},
		get resumePromptPending() {
			return resumePromptPending;
		},
		acknowledgeResume() {
			resumePromptPending = false;
			resumeAcknowledged = true;
			persist(snapshot());
		},
		reset() {
			disclaimerAcked = false;
			parentViewRequested = false;
			resumeAcknowledged = false;
			preferences = [];
			screening = [];
			strengths = [];
			resumePromptPending = false;
			if (typeof window !== 'undefined') {
				try {
					window.sessionStorage.removeItem(STORAGE_KEY);
				} catch {
					// ignore
				}
			}
		}
	};
}

export const exploreStore = createStore();
