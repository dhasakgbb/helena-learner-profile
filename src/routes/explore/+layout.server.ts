import type { LayoutServerLoad } from './$types';
import { getActiveItems, type ItemsSource } from '$lib/services/items.server';

export const load: LayoutServerLoad = async ({ locals }) => {
	const ownerId = locals.parent?.id ?? null;
	const [preferences, screening, strengths] = await Promise.all([
		getActiveItems('preferences', ownerId),
		getActiveItems('screening', ownerId),
		getActiveItems('strengths', ownerId)
	]);

	// If ANY module fell back to static for a signed-in parent, propagate the
	// problem to the page so we can show a banner. A normal static load
	// (anonymous visitor, no customizations) is not a warning.
	const fellBack: ItemsSource = [preferences, screening, strengths].some(
		(r) => r.source === 'static_fallback'
	)
		? 'static_fallback'
		: 'static';

	return {
		ownerId,
		usedStaticFallback: ownerId !== null && fellBack === 'static_fallback',
		items: {
			preferences: preferences.items,
			screening: screening.items,
			strengths: strengths.items
		}
	};
};
