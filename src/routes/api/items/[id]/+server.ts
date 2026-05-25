import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import {
	itemUpdateSchema,
	preferencesPayloadSchema,
	screeningPayloadSchema,
	strengthsPayloadSchema
} from '$lib/schemas/items';
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

function validatePayloadForKind(kind: string, payload: unknown) {
	if (kind === 'preferences') return preferencesPayloadSchema.safeParse(payload);
	if (kind === 'screening') return screeningPayloadSchema.safeParse(payload);
	if (kind === 'strengths') return strengthsPayloadSchema.safeParse(payload);
	return { success: false as const, error: new Error('unknown kind') };
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
	if (parsed.data.payload !== undefined) {
		// Critical: payload must match the existing item's kind. Without this
		// guard, a malicious or buggy client could replace a screening item's
		// payload with a preferences shape and corrupt the bank.
		const payloadCheck = validatePayloadForKind(row.kind, parsed.data.payload);
		if (!payloadCheck.success) {
			return json(
				{ error: 'payload_kind_mismatch', kind: row.kind },
				{ status: 400 }
			);
		}
		updates.payload = payloadCheck.data as object;
	}
	const [updated] = await db()
		.update(schema.items)
		.set(updates)
		.where(eq(schema.items.id, row.id))
		.returning();
	return json({ item: updated });
};

export const DELETE: RequestHandler = async (event) => {
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
