import type { LayoutServerLoad } from './$types';
import { getActiveItems } from '$lib/services/items.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const ownerId = locals.parent?.id ?? null;
	const [preferences, screening, strengths] = await Promise.all([
		getActiveItems('preferences', ownerId),
		getActiveItems('screening', ownerId),
		getActiveItems('strengths', ownerId)
	]);
	return {
		ownerId,
		items: { preferences, screening, strengths }
	};
};
