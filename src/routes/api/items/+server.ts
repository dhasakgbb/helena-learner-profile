import { json, type RequestHandler } from '@sveltejs/kit';
import { requireParent } from '$lib/auth/session';
import { itemCreateSchema, itemKindSchema } from '$lib/schemas/items';
import { db, schema } from '$lib/db';
import { and, asc, eq, max } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const kindParam = event.url.searchParams.get('kind');
	const kind = kindParam ? itemKindSchema.safeParse(kindParam) : null;
	const where = kind?.success
		? and(eq(schema.items.ownerId, parent.id), eq(schema.items.kind, kind.data))
		: eq(schema.items.ownerId, parent.id);
	const rows = await db()
		.select()
		.from(schema.items)
		.where(where)
		.orderBy(asc(schema.items.kind), asc(schema.items.createdAt));
	return json({ items: rows });
};

export const POST: RequestHandler = async (event) => {
	const parent = requireParent(event);
	const body = await event.request.json().catch(() => ({}));
	const parsed = itemCreateSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ error: 'validation_failed', details: parsed.error.flatten() },
			{ status: 400 }
		);
	}
	const { kind, slug, payload, weight, parent_notes } = parsed.data;

	// Wrap version-bump + deactivate-old + insert-new in a single transaction
	// so two concurrent POSTs for the same slug can't both compute the same
	// nextVersion and crash on the UNIQUE (owner,kind,slug,version) constraint.
	try {
		const row = await db().transaction(async (tx) => {
			const existing = await tx
				.select({ v: max(schema.items.version) })
				.from(schema.items)
				.where(
					and(
						eq(schema.items.ownerId, parent.id),
						eq(schema.items.kind, kind),
						eq(schema.items.slug, slug)
					)
				);
			const nextVersion = (existing[0]?.v ?? 0) + 1;
			if (nextVersion > 1) {
				await tx
					.update(schema.items)
					.set({ active: false, updatedAt: new Date() })
					.where(
						and(
							eq(schema.items.ownerId, parent.id),
							eq(schema.items.kind, kind),
							eq(schema.items.slug, slug)
						)
					);
			}
			const [inserted] = await tx
				.insert(schema.items)
				.values({
					ownerId: parent.id,
					kind,
					slug,
					version: nextVersion,
					payload,
					weight: weight ?? 1.0,
					parentNotes: parent_notes ?? null,
					active: true
				})
				.returning();
			return inserted;
		});
		return json({ item: row }, { status: 201 });
	} catch (err) {
		// If two concurrent POSTs still race past the transaction (e.g. read
		// committed isolation lets both see the same max), the UNIQUE
		// constraint surfaces as a 23505. Surface a stable retryable error.
		const code = (err as { code?: string }).code;
		if (code === '23505') {
			return json({ error: 'version_conflict' }, { status: 409 });
		}
		throw err;
	}
};
