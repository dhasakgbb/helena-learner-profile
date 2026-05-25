import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import { childCreateSchema } from '$lib/schemas/children';
import { db, schema } from '$lib/db';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const rows = await db()
		.select({
			id: schema.children.id,
			display_name: schema.children.displayName,
			birth_year: schema.children.birthYear
		})
		.from(schema.children)
		.where(eq(schema.children.parentId, parent.id))
		.orderBy(asc(schema.children.createdAt));
	return json({ children: rows });
};

export const POST: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const body = await event.request.json().catch(() => ({}));
	const parsed = childCreateSchema.safeParse(body);
	if (!parsed.success) return json({ error: 'validation_failed' }, { status: 400 });
	const [row] = await db()
		.insert(schema.children)
		.values({
			parentId: parent.id,
			displayName: parsed.data.display_name,
			birthYear: parsed.data.birth_year
		})
		.returning({
			id: schema.children.id,
			display_name: schema.children.displayName,
			birth_year: schema.children.birthYear
		});
	return json({ child: row }, { status: 201 });
};
