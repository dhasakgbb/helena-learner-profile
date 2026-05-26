import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/db';
import { and, desc, eq } from 'drizzle-orm';
import { buildExportedProfile } from '$lib/profile/schema';
import type { RunPayload } from '$lib/types';

/**
 * Hub page server-load. Requires a signed-in parent (so we can scope which
 * child's profile we're using) and pulls the most-recent saved run for the
 * first child as the active profile.
 *
 * If the parent has no children OR no saved runs, we still render the page —
 * but with a fallback message asking them to take the intake first.
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.parent) throw redirect(302, '/parent/login');

	const children = await db()
		.select({
			id: schema.children.id,
			display_name: schema.children.displayName,
			birth_year: schema.children.birthYear
		})
		.from(schema.children)
		.where(eq(schema.children.parentId, locals.parent.id))
		.orderBy(schema.children.createdAt);

	if (children.length === 0) {
		return { parent: locals.parent, child: null, profile: null };
	}

	const first = children[0]!;
	const [latestRun] = await db()
		.select({ payload: schema.runs.payload })
		.from(schema.runs)
		.where(and(eq(schema.runs.childId, first.id)))
		.orderBy(desc(schema.runs.takenAt))
		.limit(1);

	if (!latestRun) {
		return { parent: locals.parent, child: first, profile: null };
	}

	const profile = buildExportedProfile(latestRun.payload as RunPayload, {
		childLabel: first.display_name
	});

	return { parent: locals.parent, child: first, profile };
};
