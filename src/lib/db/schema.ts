import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	jsonb,
	boolean,
	real,
	check,
	index,
	unique
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const parents = pgTable('parents', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const children = pgTable(
	'children',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		parentId: uuid('parent_id')
			.notNull()
			.references(() => parents.id, { onDelete: 'cascade' }),
		displayName: text('display_name').notNull(),
		birthYear: integer('birth_year').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		// Wide soft floor at the DB level; the actual UX-facing min/max lives
		// in $lib/schemas/children.ts and tracks the current year. The DB check
		// is here to catch only obviously-bogus values (year 1900, year 9999).
		birthYearRange: check(
			'children_birth_year_range',
			sql`${table.birthYear} BETWEEN 1990 AND 2100`
		)
	})
);

export const runs = pgTable(
	'runs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		childId: uuid('child_id')
			.notNull()
			.references(() => children.id, { onDelete: 'cascade' }),
		takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow().notNull(),
		payload: jsonb('payload').notNull(),
		appVersion: text('app_version').notNull(),
		itemVersions: jsonb('item_versions')
	},
	(table) => ({
		childTaken: index('runs_child_taken').on(table.childId, table.takenAt)
	})
);

/**
 * Items table — the editable question bank. `kind` distinguishes module
 * (preferences / screening / strengths). `payload` holds the shape-specific
 * fields. `slug` is the human-stable identifier (e.g. "p1-lego") so multiple
 * versions of the same logical item can be tracked across edits.
 *
 * Items are never hard-deleted; setting `active=false` retires them. Old runs
 * still reference (id, version) so their answers stay interpretable.
 */
export const items = pgTable(
	'items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		ownerId: uuid('owner_id').references(() => parents.id, { onDelete: 'cascade' }),
		kind: text('kind').notNull(),
		slug: text('slug').notNull(),
		version: integer('version').notNull().default(1),
		payload: jsonb('payload').notNull(),
		active: boolean('active').notNull().default(true),
		weight: real('weight').notNull().default(1.0),
		parentNotes: text('parent_notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		kindValid: check(
			'items_kind_valid',
			sql`${table.kind} IN ('preferences', 'screening', 'strengths')`
		),
		ownerKindSlugVersion: unique('items_owner_kind_slug_version').on(
			table.ownerId,
			table.kind,
			table.slug,
			table.version
		),
		byOwnerKind: index('items_owner_kind_active').on(
			table.ownerId,
			table.kind,
			table.active
		)
	})
);

export type ParentRow = typeof parents.$inferSelect;
export type ChildRow = typeof children.$inferSelect;
export type RunRow = typeof runs.$inferSelect;
export type ItemRow = typeof items.$inferSelect;
