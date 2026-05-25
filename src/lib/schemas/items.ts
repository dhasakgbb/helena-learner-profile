import { z } from 'zod';
import { prefModeSchema, domainSchema } from './runs';

export const itemKindSchema = z.enum(['preferences', 'screening', 'strengths']);
export type ItemKind = z.infer<typeof itemKindSchema>;

export const preferencesPayloadSchema = z.object({
	prompt: z.string().min(5).max(400),
	multiSelect: z.boolean(),
	options: z
		.array(
			z.object({
				tag: prefModeSchema,
				text: z.string().min(3).max(280)
			})
		)
		.length(4)
		.refine((opts) => new Set(opts.map((o) => o.tag)).size === 4, {
			message: 'All four mode tags must be present exactly once.'
		})
});

export const screeningPayloadSchema = z.object({
	domain: domainSchema,
	kidPrompt: z.string().min(5).max(280),
	parentPrompt: z.string().min(5).max(280)
});

export const strengthsPayloadSchema = z.object({
	prompt: z.string().min(5).max(280)
});

export const itemCreateSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('preferences'),
		slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase alphanumeric + hyphens only').min(2).max(60),
		payload: preferencesPayloadSchema,
		weight: z.number().min(0).max(5).optional(),
		parent_notes: z.string().max(500).optional()
	}),
	z.object({
		kind: z.literal('screening'),
		slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(60),
		payload: screeningPayloadSchema,
		weight: z.number().min(0).max(5).optional(),
		parent_notes: z.string().max(500).optional()
	}),
	z.object({
		kind: z.literal('strengths'),
		slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(60),
		payload: strengthsPayloadSchema,
		weight: z.number().min(0).max(5).optional(),
		parent_notes: z.string().max(500).optional()
	})
]);

export const itemUpdateSchema = z
	.object({
		payload: z.unknown().optional(),
		active: z.boolean().optional(),
		weight: z.number().min(0).max(5).optional(),
		parent_notes: z.string().max(500).optional()
	})
	.refine((v) => Object.keys(v).length > 0, 'at least one field required');

export type ItemCreate = z.infer<typeof itemCreateSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
