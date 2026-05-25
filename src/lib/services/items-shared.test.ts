import { describe, it, expect, vi } from 'vitest';

// We test only the pure transformation helpers here. The DB-dependent paths
// are covered by the live smoke tests in the deploy verification.

describe('snapshotVersions', () => {
	it('builds a map keyed by item id', async () => {
		const { snapshotVersions } = await import('./items-shared');
		const result = snapshotVersions([
			{
				id: 'p1-lego',
				prompt: '',
				multiSelect: false,
				options: [],
				__source: 'db',
				__itemId: 'uuid-1',
				__version: 3,
				__weight: 1.0
				// biome-ignore lint: test stub
			} as any,
			{
				id: 's-read-1',
				domain: 'reading',
				kidPrompt: '',
				parentPrompt: '',
				__source: 'static',
				__itemId: null,
				__version: 0,
				__weight: 1.0
				// biome-ignore lint: test stub
			} as any
		]);
		expect(result['p1-lego']).toEqual({ id: 'uuid-1', version: 3 });
		expect(result['s-read-1']).toEqual({ id: null, version: 0 });
	});
});
