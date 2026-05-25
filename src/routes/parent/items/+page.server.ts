import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/db';
import { asc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.parent) throw redirect(302, '/parent/login');
	const rows = await db()
		.select()
		.from(schema.items)
		.where(eq(schema.items.ownerId, locals.parent.id))
		.orderBy(asc(schema.items.kind), asc(schema.items.slug), asc(schema.items.version));
	return { items: rows };
};
