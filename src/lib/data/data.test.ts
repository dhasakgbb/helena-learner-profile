import { describe, it, expect } from 'vitest';
import { PREFERENCES_ITEMS } from './preferences-items';
import { SCREENING_ITEMS } from './screening-items';
import { STRENGTHS_ITEMS } from './strengths-items';
import { PREFERENCE_STRATEGIES, DOMAIN_STRATEGIES } from './resources';

describe('PREFERENCES_ITEMS', () => {
	it('has 10 items', () => {
		expect(PREFERENCES_ITEMS).toHaveLength(10);
	});
	it('each item has 4 options covering all 4 modes', () => {
		for (const item of PREFERENCES_ITEMS) {
			expect(item.options).toHaveLength(4);
			const tags = new Set(item.options.map((o) => o.tag));
			expect(tags.size).toBe(4);
		}
	});
	it('contains both single-select and multi-select items', () => {
		const singles = PREFERENCES_ITEMS.filter((i) => !i.multiSelect);
		const multis = PREFERENCES_ITEMS.filter((i) => i.multiSelect);
		expect(singles.length).toBeGreaterThan(0);
		expect(multis.length).toBeGreaterThan(0);
	});
});

describe('SCREENING_ITEMS', () => {
	it('has 12 items, 3 per domain', () => {
		expect(SCREENING_ITEMS).toHaveLength(12);
		const byDomain = SCREENING_ITEMS.reduce<Record<string, number>>((acc, i) => {
			acc[i.domain] = (acc[i.domain] ?? 0) + 1;
			return acc;
		}, {});
		expect(byDomain.reading).toBe(3);
		expect(byDomain.writing).toBe(3);
		expect(byDomain.math).toBe(3);
		expect(byDomain.attention).toBe(3);
	});
	it('each item has both kid and parent prompts', () => {
		for (const item of SCREENING_ITEMS) {
			expect(item.kidPrompt.length).toBeGreaterThan(10);
			expect(item.parentPrompt.length).toBeGreaterThan(10);
		}
	});
});

describe('STRENGTHS_ITEMS', () => {
	it('has 6 items', () => {
		expect(STRENGTHS_ITEMS).toHaveLength(6);
	});
});

describe('resources', () => {
	it('has at least one card per preference mode', () => {
		for (const mode of ['visual', 'auditory', 'read_write', 'kinesthetic'] as const) {
			expect(PREFERENCE_STRATEGIES[mode].length).toBeGreaterThan(0);
		}
	});
	it('has at least one card per domain', () => {
		for (const d of ['reading', 'writing', 'math', 'attention'] as const) {
			expect(DOMAIN_STRATEGIES[d].length).toBeGreaterThan(0);
		}
	});
});
