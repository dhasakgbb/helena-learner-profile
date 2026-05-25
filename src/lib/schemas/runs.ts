import { z } from 'zod';

export const prefModeSchema = z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']);
export const domainSchema = z.enum(['reading', 'writing', 'math', 'attention']);
export const flagSchema = z.enum(['low', 'medium', 'high']);
export const planSchema = z.enum(['strengths', 'monitor', 'schedule']);

const frequencyAnswer = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const likertAnswer = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const preferencesAnswerSchema = z.object({
	itemId: z.string(),
	selectedTags: z.array(prefModeSchema)
});

export const screeningAnswerSchema = z.object({
	itemId: z.string(),
	kid: frequencyAnswer.nullable(),
	parent: frequencyAnswer.nullable()
});

export const strengthsAnswerSchema = z.object({
	itemId: z.string(),
	value: likertAnswer
});

export const domainScoreSchema = z.object({
	level: flagSchema,
	raw: z.number().int().min(0).max(12),
	needs_corroboration: z.boolean()
});

export const runPayloadSchema = z.object({
	app_version: z.string(),
	taken_at: z.string(),
	preferences: z.array(preferencesAnswerSchema),
	screening: z.array(screeningAnswerSchema),
	strengths: z.array(strengthsAnswerSchema),
	scores: z.object({
		preferences: z.object({
			visual: z.number(),
			auditory: z.number(),
			read_write: z.number(),
			kinesthetic: z.number()
		}),
		screening: z.object({
			reading: domainScoreSchema,
			writing: domainScoreSchema,
			math: domainScoreSchema,
			attention: domainScoreSchema
		}),
		strengths_spotlight: z.array(z.string()),
		plan: planSchema
	})
});

export const itemVersionMapSchema = z.record(
	z.string(),
	z.object({ id: z.string().uuid().nullable(), version: z.number().int().min(0) })
);

export const saveRunRequestSchema = z.object({
	child_id: z.string().uuid(),
	payload: runPayloadSchema,
	item_versions: z
		.object({
			preferences: itemVersionMapSchema,
			screening: itemVersionMapSchema,
			strengths: itemVersionMapSchema
		})
		.optional()
});

export type SaveRunRequest = z.infer<typeof saveRunRequestSchema>;
