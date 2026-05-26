import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Telemetry viewer is a pure client-side paste-and-render tool. The server
 * load only enforces auth — no DB reads, no persistence. Re-exported
 * profiles never touch the server (we don't want telemetry-pretending-to-be
 * a profile leaking through our request logs).
 */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.parent) throw redirect(302, '/parent/login');
	return { parentEmail: locals.parent.email };
};
