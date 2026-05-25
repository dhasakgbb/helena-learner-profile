import { describe, it, expect } from 'vitest';
import { scorePreferences } from './preferences';

describe('scorePreferences', () => {
	it('returns all zeros when no answers', () => {
		expect(scorePreferences([])).toEqual({
			visual: 0,
			auditory: 0,
			read_write: 0,
			kinesthetic: 0
		});
	});

	it('treats an answer with empty selectedTags as zero contribution', () => {
		expect(scorePreferences([{ itemId: 'p1', selectedTags: [] }])).toEqual({
			visual: 0,
			auditory: 0,
			read_write: 0,
			kinesthetic: 0
		});
	});

	it('returns 100% for a single-mode single answer', () => {
		const result = scorePreferences([{ itemId: 'p1', selectedTags: ['visual'] }]);
		expect(result.visual).toBe(100);
		expect(result.auditory).toBe(0);
		expect(result.read_write).toBe(0);
		expect(result.kinesthetic).toBe(0);
	});

	it('splits percentages by total tag-count across all answers', () => {
		const result = scorePreferences([
			{ itemId: 'p1', selectedTags: ['visual'] },
			{ itemId: 'p2', selectedTags: ['visual', 'kinesthetic'] }
		]);
		expect(result.visual).toBe(67);
		expect(result.kinesthetic).toBe(33);
		expect(result.auditory).toBe(0);
	});

	it('sums to ~100 with three evenly distributed answers', () => {
		const result = scorePreferences([
			{ itemId: 'p1', selectedTags: ['visual'] },
			{ itemId: 'p2', selectedTags: ['auditory'] },
			{ itemId: 'p3', selectedTags: ['read_write'] }
		]);
		const sum = result.visual + result.auditory + result.read_write + result.kinesthetic;
		expect(sum).toBeGreaterThanOrEqual(99);
		expect(sum).toBeLessThanOrEqual(100);
	});

	it('handles all four modes balanced', () => {
		const result = scorePreferences([
			{ itemId: 'p1', selectedTags: ['visual'] },
			{ itemId: 'p2', selectedTags: ['auditory'] },
			{ itemId: 'p3', selectedTags: ['read_write'] },
			{ itemId: 'p4', selectedTags: ['kinesthetic'] }
		]);
		expect(result.visual).toBe(25);
		expect(result.auditory).toBe(25);
		expect(result.read_write).toBe(25);
		expect(result.kinesthetic).toBe(25);
	});
});
