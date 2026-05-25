import { describe, it, expect } from 'vitest';
import { SECURITY_HEADERS, applySecurityHeaders } from './headers';

describe('security headers', () => {
	it('declares the essential headers', () => {
		expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy');
		expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options', 'DENY');
		expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options', 'nosniff');
		expect(SECURITY_HEADERS).toHaveProperty('Referrer-Policy');
		expect(SECURITY_HEADERS).toHaveProperty('Permissions-Policy');
	});

	it('CSP forbids framing and locks default-src to self', () => {
		const csp = SECURITY_HEADERS['Content-Security-Policy']!;
		expect(csp).toMatch(/default-src 'self'/);
		expect(csp).toMatch(/frame-ancestors 'none'/);
		expect(csp).toMatch(/object-src 'none'/);
	});

	it('CSP allows Google Fonts', () => {
		const csp = SECURITY_HEADERS['Content-Security-Policy']!;
		expect(csp).toMatch(/fonts\.googleapis\.com/);
		expect(csp).toMatch(/fonts\.gstatic\.com/);
	});

	it('applySecurityHeaders mutates Headers in place and does not overwrite existing', () => {
		const h = new Headers();
		h.set('X-Frame-Options', 'SAMEORIGIN'); // pre-existing
		applySecurityHeaders(h);
		expect(h.get('X-Frame-Options')).toBe('SAMEORIGIN'); // preserved
		expect(h.get('Content-Security-Policy')).toBeTruthy(); // added
		expect(h.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});
});
