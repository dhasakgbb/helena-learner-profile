// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { exportRunToPdf } from './export';
import { buildRun } from '../scoring/build-run';
import { SCREENING_ITEMS } from '../data/screening-items';

describe('exportRunToPdf', () => {
	const run = buildRun({
		appVersion: 'test',
		screeningItems: SCREENING_ITEMS,
		preferences: [{ itemId: 'p1-lego', selectedTags: ['visual'] }],
		screening: SCREENING_ITEMS.map((i) => ({ itemId: i.id, kid: 0, parent: 0 })),
		strengths: [
			{ itemId: 'st-1', value: 2 },
			{ itemId: 'st-2', value: 2 }
		]
	});

	it('produces a non-empty PDF blob with the right magic bytes', async () => {
		const blob = await exportRunToPdf(run);
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.size).toBeGreaterThan(1000);
		const buf = new Uint8Array(await blob.arrayBuffer());
		// %PDF magic bytes
		expect(String.fromCharCode(...buf.slice(0, 4))).toBe('%PDF');
	});

	it('handles a run with empty strengths_spotlight', async () => {
		const emptyRun = buildRun({
			appVersion: 'test',
			screeningItems: SCREENING_ITEMS,
			preferences: [{ itemId: 'p1-lego', selectedTags: ['visual'] }],
			screening: SCREENING_ITEMS.map((i) => ({ itemId: i.id, kid: 0, parent: 0 })),
			strengths: []
		});
		const blob = await exportRunToPdf(emptyRun);
		expect(blob.size).toBeGreaterThan(1000);
	});

	it('handles a fully zero run (user landing on results without answering)', async () => {
		const zeroRun = buildRun({
			appVersion: 'test',
			screeningItems: SCREENING_ITEMS,
			preferences: [],
			screening: [],
			strengths: []
		});
		const blob = await exportRunToPdf(zeroRun);
		expect(blob.size).toBeGreaterThan(1000);
	});
});
