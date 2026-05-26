/**
 * Exported profile — the canonical shape Helena platform modules consume.
 *
 * Decoupled from the internal RunPayload on purpose:
 * - RunPayload contains raw answers (private, irrelevant to downstream modules).
 * - ExportedProfile contains only the normalized signal a module needs to set
 *   defaults: preference percentages, per-domain flags, strengths text, plan.
 *
 * Versioned. Time-boxed (60 day TTL). Modules can extend via the
 * `module_overrides` namespace without touching the shared fields.
 *
 * Copy this file (plus zod-schema.ts) into any consuming module (Spelling,
 * States, Math, etc.) to get type-safe import.
 */
import { z } from 'zod';
import type { RunPayload } from '$lib/types';
import { STRENGTHS_ITEMS } from '$lib/data/strengths-items';

export const PROFILE_VERSION = 1 as const;
export const PROFILE_TTL_DAYS = 60;

const flagLevel = z.enum(['low', 'medium', 'high']);
const planLevel = z.enum(['strengths', 'monitor', 'schedule']);

export const exportedProfileSchema = z.object({
	version: z.literal(PROFILE_VERSION),
	generated_at: z.string().datetime(),
	expires_at: z.string().datetime(),
	preferences: z.object({
		visual: z.number().min(0).max(100),
		auditory: z.number().min(0).max(100),
		read_write: z.number().min(0).max(100),
		kinesthetic: z.number().min(0).max(100)
	}),
	flags: z.object({
		reading: flagLevel,
		writing: flagLevel,
		math: flagLevel,
		attention: flagLevel
	}),
	needs_corroboration: z.object({
		reading: z.boolean(),
		writing: z.boolean(),
		math: z.boolean(),
		attention: z.boolean()
	}),
	strengths: z.array(z.string()),
	plan: planLevel,
	module_overrides: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
	source: z.enum(['intake_quiz', 'parent_edit', 'behavioral_observation']),
	child_label: z.string().max(40).optional()
});

export type ExportedProfile = z.infer<typeof exportedProfileSchema>;

/** Convert a RunPayload + optional child label into the exportable shape. */
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
