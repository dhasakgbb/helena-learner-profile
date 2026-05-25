import { describe, it, expect } from 'vitest';
import { buildRun } from './build-run';

const SCREENING_ITEMS = [
	{ id: 'r1', domain: 'reading' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'r2', domain: 'reading' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'r3', domain: 'reading' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'w1', domain: 'writing' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'w2', domain: 'writing' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'w3', domain: 'writing' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'm1', domain: 'math' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'm2', domain: 'math' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'm3', domain: 'math' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'a1', domain: 'attention' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'a2', domain: 'attention' as const, kidPrompt: '', parentPrompt: '' },
	{ id: 'a3', domain: 'attention' as const, kidPrompt: '', parentPrompt: '' }
];

describe('buildRun', () => {
	it('assembles a complete RunPayload from raw answers', () => {
		const run = buildRun({
			appVersion: '0.1.0',
			screeningItems: SCREENING_ITEMS,
			preferences: [
				{ itemId: 'p1', selectedTags: ['visual'] },
				{ itemId: 'p2', selectedTags: ['visual'] }
			],
			screening: SCREENING_ITEMS.map((i) => ({
				itemId: i.id,
				kid: 0,
				parent: 0
			})),
			strengths: [
				{ itemId: 's1', value: 2 },
				{ itemId: 's2', value: 1 }
			]
		});
		expect(run.app_version).toBe('0.1.0');
		expect(typeof run.taken_at).toBe('string');
		expect(run.scores.preferences.visual).toBe(100);
		expect(run.scores.screening.reading.level).toBe('low');
		expect(run.scores.strengths_spotlight).toEqual(['s1']);
		expect(run.scores.plan).toBe('strengths');
	});

	it('propagates plan="schedule" when a high domain is present', () => {
		const run = buildRun({
			appVersion: '0.1.0',
			screeningItems: SCREENING_ITEMS,
			preferences: [],
			screening: SCREENING_ITEMS.map((i) => ({
				itemId: i.id,
				kid: i.domain === 'reading' ? 4 : 0,
				parent: i.domain === 'reading' ? 4 : 0
			})),
			strengths: []
		});
		expect(run.scores.screening.reading.level).toBe('high');
		expect(run.scores.plan).toBe('schedule');
	});
});
