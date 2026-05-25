/**
 * Security headers applied to every response by hooks.server.ts.
 *
 * The CSP is tuned for: this app's first-party assets, SvelteKit's hashed JS
 * chunks, Google Fonts (CSS at fonts.googleapis.com, font files at
 * fonts.gstatic.com), and inline styles that Svelte's `style:` directive emits.
 * If you add a new external origin (analytics, image CDN, etc.), update this
 * map first.
 */
export const SECURITY_HEADERS: Record<string, string> = {
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com data:",
		"img-src 'self' data: blob:",
		"connect-src 'self'",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'"
	].join('; '),
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy':
		'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'X-Permitted-Cross-Domain-Policies': 'none'
};

export function applySecurityHeaders(headers: Headers): void {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(key)) {
			headers.set(key, value);
		}
	}
}
