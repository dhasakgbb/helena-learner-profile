import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	jsonb,
	check,
	index
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
		birthYearRange: check(
			'children_birth_year_range',
			sql`${table.birthYear} BETWEEN 2005 AND 2025`
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
		appVersion: text('app_version').notNull()
	},
	(table) => ({
		childTaken: index('runs_child_taken').on(table.childId, table.takenAt)
	})
);

export type ParentRow = typeof parents.$inferSelect;
export type ChildRow = typeof children.$inferSelect;
export type RunRow = typeof runs.$inferSelect;
