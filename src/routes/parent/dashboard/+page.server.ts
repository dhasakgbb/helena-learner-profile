import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/db';
import { and, desc, eq } from 'drizzle-orm';
import type { RunPayload } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.parent) throw redirect(302, '/parent/login');
	const parentId = locals.parent.id;
	const kids = await db()
		.select({
			id: schema.children.id,
			display_name: schema.children.displayName,
			birth_year: schema.children.birthYear
		})
		.from(schema.children)
		.where(eq(schema.children.parentId, parentId))
		.orderBy(schema.children.createdAt);

	const runsByChild: Record<string, { id: string; taken_at: Date; plan: string; payload: RunPayload }[]> = {};
	for (const k of kids) {
		const rows = await db()
			.select({
				id: schema.runs.id,
				taken_at: schema.runs.takenAt,
				payload: schema.runs.payload
			})
			.from(schema.runs)
			.where(and(eq(schema.runs.childId, k.id)))
			.orderBy(desc(schema.runs.takenAt));
		runsByChild[k.id] = rows.map((r) => {
			const payload = r.payload as RunPayload;
			return {
				id: r.id,
				taken_at: r.taken_at,
				plan: payload.scores?.plan ?? 'strengths',
				payload
			};
		});
	}

	return {
		parent: locals.parent,
		children: kids,
		runsByChild
	};
};
