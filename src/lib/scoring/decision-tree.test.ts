import { describe, it, expect } from 'vitest';
import { pickPlan } from './decision-tree';
import type { Domain, FlagLevel } from '$lib/types';

function flags(map: Partial<Record<Domain, FlagLevel>> = {}): Record<Domain, FlagLevel> {
	return {
		reading: map.reading ?? 'low',
		writing: map.writing ?? 'low',
		math: map.math ?? 'low',
		attention: map.attention ?? 'low'
	};
}

describe('pickPlan', () => {
	it('returns "strengths" when all domains are low', () => {
		expect(pickPlan(flags())).toBe('strengths');
	});

	it('returns "monitor" when exactly one domain is medium', () => {
		expect(pickPlan(flags({ reading: 'medium' }))).toBe('monitor');
	});

	it('returns "schedule" when two domains are medium', () => {
		expect(pickPlan(flags({ reading: 'medium', math: 'medium' }))).toBe('schedule');
	});

	it('returns "schedule" when any one domain is high', () => {
		expect(pickPlan(flags({ math: 'high' }))).toBe('schedule');
	});

	it('returns "schedule" for mixed medium and high', () => {
		expect(pickPlan(flags({ reading: 'medium', math: 'high' }))).toBe('schedule');
	});
});
