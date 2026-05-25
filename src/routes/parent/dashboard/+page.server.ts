import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/db';
import { desc, eq, inArray } from 'drizzle-orm';
import type { RunPayload } from '$lib/types';

type RunSummary = {
	id: string;
	taken_at: Date;
	plan: string;
	payload: RunPayload;
};

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

	const runsByChild: Record<string, RunSummary[]> = {};
	for (const k of kids) runsByChild[k.id] = [];

	if (kids.length > 0) {
		const allRuns = await db()
			.select({
				id: schema.runs.id,
				child_id: schema.runs.childId,
				taken_at: schema.runs.takenAt,
				payload: schema.runs.payload
			})
			.from(schema.runs)
			.where(inArray(schema.runs.childId, kids.map((k) => k.id)))
			.orderBy(desc(schema.runs.takenAt));

		for (const r of allRuns) {
			const payload = r.payload as RunPayload;
			const bucket = runsByChild[r.child_id];
			if (bucket) {
				bucket.push({
					id: r.id,
					taken_at: r.taken_at,
					plan: payload.scores?.plan ?? 'strengths',
					payload
				});
			}
		}
	}

	return {
		parent: locals.parent,
		children: kids,
		runsByChild
	};
};
