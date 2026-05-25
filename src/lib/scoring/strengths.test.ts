import { describe, it, expect } from 'vitest';
import { scoreStrengths } from './strengths';

describe('scoreStrengths', () => {
	it('returns empty when no answers', () => {
		expect(scoreStrengths([])).toEqual([]);
	});

	it('returns only item IDs answered Sounds like me (value 2)', () => {
		const result = scoreStrengths([
			{ itemId: 's1', value: 2 },
			{ itemId: 's2', value: 1 },
			{ itemId: 's3', value: 0 },
			{ itemId: 's4', value: 2 }
		]);
		expect(result).toEqual(['s1', 's4']);
	});

	it('preserves input order', () => {
		const result = scoreStrengths([
			{ itemId: 's3', value: 2 },
			{ itemId: 's1', value: 2 }
		]);
		expect(result).toEqual(['s3', 's1']);
	});
});
