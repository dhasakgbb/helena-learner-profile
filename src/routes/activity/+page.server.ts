import type { PageServerLoad } from './$types';

/**
 * App-activity viewer is pure client-side: it renders the telemetry inside a
 * pasted (or URL-fragment-supplied) profile JSON. Nothing is read from or
 * written to our DB, so auth is not required — the parent already possesses
 * the JSON, and gating wouldn't change what they can see.
 *
 * Crucially: by NOT redirecting (auth-gating would), this route lets a
 * #profile=… fragment supplied by a cross-origin consumer survive the
 * navigation. SvelteKit's 302 to /parent/login would otherwise strip the
 * fragment before the page mounts.
 */
export const load: PageServerLoad = async () => {
	return {};
};
