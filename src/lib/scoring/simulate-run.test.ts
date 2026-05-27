/**
 * Local simulation: feeds three plausible personas through the real
 * buildRun() and prints what each would see at the end of an actual run.
 * Asserts the decision tree picked the right plan, so this also serves
 * as a regression test for the three terminal branches.
 *
 * Run with:  npx vitest run scripts/simulate-run.test.ts
 */
import { describe, it, expect } from 'vitest';
import { buildRun } from './build-run';
import { PREFERENCES_ITEMS } from '../data/preferences-items';
import { SCREENING_ITEMS } from '../data/screening-items';
import {
	STRENGTHS_ITEMS,
	STRENGTHS_AFFIRMATIONS
} from '../data/strengths-items';
import type {
	PreferencesAnswer,
	ScreeningAnswer,
	StrengthsAnswer,
	FrequencyAnswer,
	LikertAnswer,
	Domain,
	PrefMode,
	RunPayload
} from '../types';

// ─── Plan-tier copy (mirrors the results page) ───────────────────────────
const PLAN_HEADLINE: Record<RunPayload['scores']['plan'], string> = {
	strengths: 'A strength-based experimentation plan.',
	monitor: 'Monitor and add multisensory supports.',
	schedule: 'Time for a conversation.'
};
const PLAN_BODY: Record<RunPayload['scores']['plan'], string> = {
	strengths:
		'Pick one strategy from your top preference this week and try it on a school task.',
	monitor:
		'One area showed up as worth watching. Try a multisensory strategy for 3-4 weeks, then re-do the explore.',
	schedule:
		'Multiple areas flagged, or one strongly. The next step is a conversation: teacher first, then pediatrician.'
};

// ─── Persona builders ────────────────────────────────────────────────────
function prefsBy(picks: Record<string, PrefMode | PrefMode[]>): PreferencesAnswer[] {
	return PREFERENCES_ITEMS.map((item) => {
		const pick = picks[item.id];
		const tags = pick === undefined ? [item.options[0]!.tag] : Array.isArray(pick) ? pick : [pick];
		return { itemId: item.id, selectedTags: tags };
	});
}

function screenBy(
	per: Partial<Record<Domain, { kid: FrequencyAnswer; parent: FrequencyAnswer | null }>>
): ScreeningAnswer[] {
	const defaults: Record<Domain, { kid: FrequencyAnswer; parent: FrequencyAnswer | null }> = {
		reading: { kid: 0, parent: 0 },
		writing: { kid: 0, parent: 0 },
		math: { kid: 0, parent: 0 },
		attention: { kid: 0, parent: 0 }
	};
	return SCREENING_ITEMS.map((item) => {
		const cfg = per[item.domain] ?? defaults[item.domain];
		return { itemId: item.id, kid: cfg.kid, parent: cfg.parent };
	});
}

function strengthsBy(values: Record<string, LikertAnswer>): StrengthsAnswer[] {
	return STRENGTHS_ITEMS.map((item) => ({
		itemId: item.id,
		value: values[item.id] ?? (1 as LikertAnswer)
	}));
}

// ─── Pretty-print ───────────────────────────────────────────────────────
function render(personaName: string, run: RunPayload) {
	const { preferences, screening, strengths_spotlight, plan } = run.scores;
	const sorted = (
		Object.entries(preferences) as [PrefMode, number][]
	).sort((a, b) => b[1] - a[1]);
	const topMode = sorted[0]![0];

	const banner = (s: string) => `\n${'='.repeat(72)}\n${s}\n${'='.repeat(72)}`;
	const out: string[] = [];
	out.push(banner(`PERSONA: ${personaName}`));

	out.push('\n── what the kid would see on /explore/results ──\n');
	out.push(`  HEADER: "Here is what stood out today."`);
	out.push('');
	out.push(`  ▸ Top preference card: top mode = ${topMode}`);
	for (const [mode, pct] of sorted) {
		const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
		out.push(`    ${mode.padEnd(13)} ${bar} ${pct}%`);
	}

	if (strengths_spotlight.length > 0) {
		out.push('');
		out.push(`  ▸ Strengths spotlight (${strengths_spotlight.length} item(s)):`);
		for (const id of strengths_spotlight) {
			const item = STRENGTHS_ITEMS.find((s) => s.id === id);
			if (item) {
				out.push(`    • "${item.prompt}"`);
				const aff = STRENGTHS_AFFIRMATIONS[id];
				if (aff) out.push(`      → ${aff.split('.')[0]}.`);
			}
		}
	} else {
		out.push('');
		out.push(`  ▸ Strengths spotlight: (none chosen as "Sounds like me")`);
	}

	out.push('');
	out.push(`  ▸ Next-step card (plan: ${plan}):`);
	out.push(`    HEADLINE: "${PLAN_HEADLINE[plan]}"`);
	out.push(`    BODY:     "${PLAN_BODY[plan]}"`);

	out.push('\n── what the parent would see in the parent-view drawer + dashboard ──\n');
	out.push(`  ▸ Areas worth watching:`);
	for (const d of ['reading', 'writing', 'math', 'attention'] as const) {
		const score = screening[d];
		const dot = score.level === 'high' ? '●' : score.level === 'medium' ? '◐' : '○';
		const note = score.needs_corroboration ? '  (needs parent corroboration)' : '';
		out.push(
			`    ${dot}  ${d.padEnd(10)} ${score.level.padEnd(7)} raw=${score.raw}/12${note}`
		);
	}

	out.push('\n── what the PDF would print ──\n');
	out.push(`  Astrid's Quiz · ${new Date(run.taken_at).toLocaleDateString()}`);
	out.push(`  Recommended next step: ${PLAN_HEADLINE[plan]}`);

	console.log(out.join('\n'));
}

// ─── Personas ────────────────────────────────────────────────────────────
describe('end-to-end run simulation', () => {
	it('PERSONA A — Visual-leaning, all strengths → strengths plan', () => {
		const run = buildRun({
			appVersion: 'sim-0.1.0',
			screeningItems: SCREENING_ITEMS,
			preferences: prefsBy({
				'p1-lego': 'visual',
				'p2-states': 'visual',
				'p3-story': ['visual', 'kinesthetic'],
				'p4-recipe': 'visual',
				'p5-game': 'visual',
				'p6-spelling': ['visual', 'read_write'],
				'p7-instructions': 'visual',
				'p8-explainer': 'visual',
				'p9-trip': ['visual', 'auditory'],
				'p10-quiet': 'kinesthetic'
			}),
			screening: screenBy({
				reading: { kid: 0, parent: 0 },
				writing: { kid: 0, parent: 0 },
				math: { kid: 1, parent: 0 },
				attention: { kid: 0, parent: 0 }
			}),
			strengths: strengthsBy({
				'st-1': 2,
				'st-2': 2,
				'st-3': 2,
				'st-4': 1,
				'st-5': 2,
				'st-6': 2
			})
		});
		render('A — Visual-leaning, all strengths', run);
		expect(run.scores.plan).toBe('strengths');
		expect(run.scores.preferences.visual).toBeGreaterThanOrEqual(60);
		expect(run.scores.strengths_spotlight.length).toBe(5);
	});

	it('PERSONA B — Mixed learner, one reading concern → monitor', () => {
		const run = buildRun({
			appVersion: 'sim-0.1.0',
			screeningItems: SCREENING_ITEMS,
			preferences: prefsBy({
				'p1-lego': 'read_write',
				'p2-states': 'auditory',
				'p3-story': ['read_write', 'auditory'],
				'p4-recipe': 'read_write',
				'p5-game': 'auditory',
				'p6-spelling': ['read_write'],
				'p7-instructions': 'read_write',
				'p8-explainer': 'auditory',
				'p9-trip': ['read_write', 'kinesthetic'],
				'p10-quiet': 'read_write'
			}),
			screening: screenBy({
				reading: { kid: 2, parent: 3 }, // 6/12 medium, parent endorses
				writing: { kid: 1, parent: 1 },
				math: { kid: 0, parent: 0 },
				attention: { kid: 1, parent: 0 }
			}),
			strengths: strengthsBy({
				'st-1': 2,
				'st-2': 1,
				'st-3': 1,
				'st-4': 2,
				'st-5': 2,
				'st-6': 0
			})
		});
		render('B — Mixed learner, one reading concern', run);
		expect(run.scores.plan).toBe('monitor');
		expect(run.scores.screening.reading.level).toBe('medium');
	});

	it('PERSONA C — Multi-flag (math high + attention high) → schedule', () => {
		const run = buildRun({
			appVersion: 'sim-0.1.0',
			screeningItems: SCREENING_ITEMS,
			preferences: prefsBy({
				'p1-lego': 'kinesthetic',
				'p2-states': 'kinesthetic',
				'p3-story': ['visual', 'kinesthetic'],
				'p4-recipe': 'kinesthetic',
				'p5-game': 'kinesthetic',
				'p6-spelling': ['kinesthetic'],
				'p7-instructions': 'visual',
				'p8-explainer': 'kinesthetic',
				'p9-trip': ['kinesthetic'],
				'p10-quiet': 'kinesthetic'
			}),
			screening: screenBy({
				reading: { kid: 1, parent: 0 },
				writing: { kid: 1, parent: 1 },
				math: { kid: 4, parent: 4 }, // 12/12 high, corroborated
				attention: { kid: 3, parent: 4 } // 9/12 high, corroborated
			}),
			strengths: strengthsBy({
				'st-1': 0,
				'st-2': 2,
				'st-3': 1,
				'st-4': 0,
				'st-5': 0,
				'st-6': 1
			})
		});
		render('C — Multi-flag (math + attention)', run);
		expect(run.scores.plan).toBe('schedule');
		expect(run.scores.screening.math.level).toBe('high');
		expect(run.scores.screening.attention.level).toBe('high');
	});
});
