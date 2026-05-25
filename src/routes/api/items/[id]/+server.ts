import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import { itemUpdateSchema } from '$lib/schemas/items';
import { db, schema } from '$lib/db';
import { and, eq } from 'drizzle-orm';

async function loadOwnedItem(id: string, parentId: string) {
	const [row] = await db()
		.select()
		.from(schema.items)
		.where(and(eq(schema.items.id, id), eq(schema.items.ownerId, parentId)))
		.limit(1);
	return row ?? null;
}

export const GET: RequestHandler = async (event) => {
	const parent = requireParent(event);
	if (!event.params.id) return json({ error: 'id_required' }, { status: 400 });
	const row = await loadOwnedItem(event.params.id, parent.id);
	if (!row) return json({ error: 'not_found' }, { status: 404 });
	return json({ item: row });
};

export const PATCH: RequestHandler = async (event) => {
	const parent = requireParent(event);
	if (!event.params.id) return json({ error: 'id_required' }, { status: 400 });
	const row = await loadOwnedItem(event.params.id, parent.id);
	if (!row) return json({ error: 'not_found' }, { status: 404 });
	const body = await event.request.json().catch(() => ({}));
	const parsed = itemUpdateSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ error: 'validation_failed', details: parsed.error.flatten() },
			{ status: 400 }
		);
	}
	const updates: Partial<typeof schema.items.$inferInsert> = {
		updatedAt: new Date()
	};
	if (parsed.data.active !== undefined) updates.active = parsed.data.active;
	if (parsed.data.weight !== undefined) updates.weight = parsed.data.weight;
	if (parsed.data.parent_notes !== undefined) updates.parentNotes = parsed.data.parent_notes;
	if (parsed.data.payload !== undefined) updates.payload = parsed.data.payload as object;
	const [updated] = await db()
		.update(schema.items)
		.set(updates)
		.where(eq(schema.items.id, row.id))
		.returning();
	return json({ item: updated });
};

export const DELETE: RequestHandler = async (event) => {
	// Soft-delete: set active=false. We never hard-delete because historic
	// runs may still reference the item id.
	const parent = requireParent(event);
	if (!event.params.id) return json({ error: 'id_required' }, { status: 400 });
	const row = await loadOwnedItem(event.params.id, parent.id);
	if (!row) return json({ error: 'not_found' }, { status: 404 });
	await db()
		.update(schema.items)
		.set({ active: false, updatedAt: new Date() })
		.where(eq(schema.items.id, row.id));
	return new Response(null, { status: 204 });
};
