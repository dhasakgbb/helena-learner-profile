import { describe, it, expect } from 'vitest';
import { scoreScreening } from './screening';
import type { ScreeningAnswer, ScreeningItem } from '$lib/types';

const ITEMS: ScreeningItem[] = [
	{ id: 'r1', domain: 'reading', kidPrompt: '', parentPrompt: '' },
	{ id: 'r2', domain: 'reading', kidPrompt: '', parentPrompt: '' },
	{ id: 'r3', domain: 'reading', kidPrompt: '', parentPrompt: '' },
	{ id: 'w1', domain: 'writing', kidPrompt: '', parentPrompt: '' },
	{ id: 'w2', domain: 'writing', kidPrompt: '', parentPrompt: '' },
	{ id: 'w3', domain: 'writing', kidPrompt: '', parentPrompt: '' },
	{ id: 'm1', domain: 'math', kidPrompt: '', parentPrompt: '' },
	{ id: 'm2', domain: 'math', kidPrompt: '', parentPrompt: '' },
	{ id: 'm3', domain: 'math', kidPrompt: '', parentPrompt: '' },
	{ id: 'a1', domain: 'attention', kidPrompt: '', parentPrompt: '' },
	{ id: 'a2', domain: 'attention', kidPrompt: '', parentPrompt: '' },
	{ id: 'a3', domain: 'attention', kidPrompt: '', parentPrompt: '' }
];

const allKid = (n: 0 | 1 | 2 | 3 | 4): ScreeningAnswer[] =>
	ITEMS.map((i) => ({ itemId: i.id, kid: n, parent: null }));

describe('scoreScreening', () => {
	it('returns low + needs_corroboration when kid Never and no parent', () => {
		const result = scoreScreening(ITEMS, allKid(0));
		for (const d of ['reading', 'writing', 'math', 'attention'] as const) {
			expect(result[d].level).toBe('low');
			expect(result[d].raw).toBe(0);
			expect(result[d].needs_corroboration).toBe(true);
		}
	});

	it('returns high for all-Almost-Always kid when parent corroborates', () => {
		const kid = allKid(4);
		const answers: ScreeningAnswer[] = kid.map((a) => ({ ...a, parent: 4 }));
		const result = scoreScreening(ITEMS, answers);
		for (const d of ['reading', 'writing', 'math', 'attention'] as const) {
			expect(result[d].level).toBe('high');
			expect(result[d].raw).toBe(12);
			expect(result[d].needs_corroboration).toBe(false);
		}
	});

	it('downgrades high to medium when parent disagrees (all Never)', () => {
		const answers: ScreeningAnswer[] = allKid(4).map((a) => ({ ...a, parent: 0 }));
		const result = scoreScreening(ITEMS, answers);
		expect(result.reading.level).toBe('medium');
		expect(result.reading.raw).toBe(12);
		expect(result.reading.needs_corroboration).toBe(false);
	});

	it('downgrades medium to low when parent disagrees', () => {
		const answers: ScreeningAnswer[] = allKid(2).map((a) => ({ ...a, parent: 1 }));
		const result = scoreScreening(ITEMS, answers);
		expect(result.reading.level).toBe('low');
		expect(result.reading.raw).toBe(6);
	});

	it('keeps medium when at least one parent answer is Often', () => {
		const answers: ScreeningAnswer[] = allKid(2).map((a, idx) => ({
			...a,
			parent: idx === 0 ? 3 : 0
		}));
		const result = scoreScreening(ITEMS, answers);
		expect(result.reading.level).toBe('medium');
		expect(result.reading.needs_corroboration).toBe(false);
	});

	it('keeps medium for unanswered parent but flags needs_corroboration', () => {
		const result = scoreScreening(ITEMS, allKid(2));
		expect(result.reading.level).toBe('medium');
		expect(result.reading.needs_corroboration).toBe(true);
	});

	it('treats domains independently', () => {
		const answers: ScreeningAnswer[] = ITEMS.map((i) => ({
			itemId: i.id,
			kid: i.domain === 'reading' ? 4 : 0,
			parent: i.domain === 'reading' ? 4 : null
		}));
		const result = scoreScreening(ITEMS, answers);
		expect(result.reading.level).toBe('high');
		expect(result.writing.level).toBe('low');
		expect(result.math.level).toBe('low');
		expect(result.attention.level).toBe('low');
	});

	it('handles missing answers as Never (0) for kid scoring', () => {
		const sparse: ScreeningAnswer[] = ITEMS.slice(0, 6).map((i) => ({
			itemId: i.id,
			kid: 4,
			parent: null
		}));
		const result = scoreScreening(ITEMS, sparse);
		expect(result.reading.raw).toBe(12);
		expect(result.writing.raw).toBe(12);
		expect(result.math.raw).toBe(0);
		expect(result.attention.raw).toBe(0);
	});
});
