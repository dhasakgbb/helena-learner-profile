// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
	buildExportedProfile,
	exportedProfileSchema,
	formatProfile,
	PROFILE_TTL_DAYS,
	PROFILE_VERSION
} from './schema';
import { buildRun } from '../scoring/build-run';
import { SCREENING_ITEMS } from '../data/screening-items';

describe('buildExportedProfile', () => {
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

	it('produces a profile that round-trips through its own zod schema', () => {
		const fixed = new Date('2026-05-26T12:00:00Z');
		const profile = buildExportedProfile(run, { childLabel: 'Astrid', now: fixed });
		const parsed = exportedProfileSchema.parse(profile);
		expect(parsed.version).toBe(PROFILE_VERSION);
		expect(parsed.generated_at).toBe(fixed.toISOString());
		// expires = now + 60d
		const expectedExpiry = new Date(fixed.getTime() + PROFILE_TTL_DAYS * 86400 * 1000);
		expect(parsed.expires_at).toBe(expectedExpiry.toISOString());
		expect(parsed.child_label).toBe('Astrid');
	});

	it('exports strengths as human-readable prompts not raw item IDs', () => {
		const profile = buildExportedProfile(run);
		expect(profile.strengths.length).toBe(2);
		expect(profile.strengths[0]).not.toMatch(/^st-/);
		expect(profile.strengths[0]).toContain('patterns');
	});

	it('preferences are 0–100 numbers per VARK mode', () => {
		const profile = buildExportedProfile(run);
		expect(profile.preferences.visual).toBeGreaterThan(0);
		expect(profile.preferences.auditory).toBe(0);
		expect(profile.preferences.read_write).toBe(0);
		expect(profile.preferences.kinesthetic).toBe(0);
	});

	it('flags match the run scoring (low for all-Never screening)', () => {
		const profile = buildExportedProfile(run);
		expect(profile.flags.reading).toBe('low');
		expect(profile.flags.writing).toBe('low');
		expect(profile.flags.math).toBe('low');
		expect(profile.flags.attention).toBe('low');
	});

	it('omits child_label when not provided', () => {
		const profile = buildExportedProfile(run);
		expect(profile.child_label).toBeUndefined();
	});

	it('initial module_overrides is an empty object', () => {
		const profile = buildExportedProfile(run);
		expect(profile.module_overrides).toEqual({});
	});

	it('formatProfile pretty-prints valid JSON', () => {
		const profile = buildExportedProfile(run);
		const text = formatProfile(profile);
		expect(text).toContain('\n  ');
		expect(JSON.parse(text)).toEqual(profile);
	});
});
