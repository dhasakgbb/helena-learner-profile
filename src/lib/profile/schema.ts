/**
 * Re-export the canonical schema from the shared package, plus producer-
 * specific helpers (buildExportedProfile, formatProfile) that depend on
 * RunPayload and the STRENGTHS_ITEMS item bank.
 *
 * Canonical schema lives in the `profile-schema` package. Do not redefine
 * it here.
 */
import type { RunPayload } from '$lib/types';
import { STRENGTHS_ITEMS } from '$lib/data/strengths-items';
import { PROFILE_TTL_DAYS, PROFILE_VERSION } from 'profile-schema';
import type { ExportedProfile } from 'profile-schema';

export {
	PROFILE_VERSION,
	PROFILE_TTL_DAYS,
	exportedProfileSchema,
	type ExportedProfile,
	type VarkChannel,
	type FlagLevel,
	type PlanLevel
} from 'profile-schema';

/**
 * Convert a RunPayload + optional child label into the exportable shape.
 * Producer-specific — depends on the item bank to translate strength IDs
 * into human-readable prompts. Stays in the producer for that reason.
 */
export function buildExportedProfile(
	run: RunPayload,
	opts: { childLabel?: string; now?: Date } = {}
): ExportedProfile {
	const now = opts.now ?? new Date();
	const expires = new Date(now.getTime() + PROFILE_TTL_DAYS * 24 * 60 * 60 * 1000);

	// Strengths come into the run as item IDs; export them as the human-readable
	// prompts so consuming modules don't need the item bank.
	const strengthPrompts = run.scores.strengths_spotlight
		.map((id) => STRENGTHS_ITEMS.find((s) => s.id === id)?.prompt)
		.filter((p): p is string => Boolean(p));

	return {
		version: PROFILE_VERSION,
		generated_at: now.toISOString(),
		expires_at: expires.toISOString(),
		preferences: { ...run.scores.preferences },
		flags: {
			reading: run.scores.screening.reading.level,
			writing: run.scores.screening.writing.level,
			math: run.scores.screening.math.level,
			attention: run.scores.screening.attention.level
		},
		needs_corroboration: {
			reading: run.scores.screening.reading.needs_corroboration,
			writing: run.scores.screening.writing.needs_corroboration,
			math: run.scores.screening.math.needs_corroboration,
			attention: run.scores.screening.attention.needs_corroboration
		},
		strengths: strengthPrompts,
		plan: run.scores.plan,
		module_overrides: {},
		source: 'intake_quiz',
		...(opts.childLabel ? { child_label: opts.childLabel } : {})
	};
}

/** Pretty-print the profile JSON for the preview card on results page. */
export function formatProfile(profile: ExportedProfile): string {
	return JSON.stringify(profile, null, 2);
}
