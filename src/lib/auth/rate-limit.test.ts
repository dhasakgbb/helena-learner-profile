import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, _resetRateLimit } from './rate-limit';

beforeEach(() => _resetRateLimit());

describe('checkRateLimit', () => {
	it('allows up to max requests in a window', () => {
		const cfg = { max: 3, windowMs: 1000 };
		expect(checkRateLimit('ip-1', cfg).allowed).toBe(true);
		expect(checkRateLimit('ip-1', cfg).allowed).toBe(true);
		expect(checkRateLimit('ip-1', cfg).allowed).toBe(true);
		expect(checkRateLimit('ip-1', cfg).allowed).toBe(false);
	});
	it('decrements remaining on each call', () => {
		const cfg = { max: 3, windowMs: 1000 };
		expect(checkRateLimit('ip-1', cfg).remaining).toBe(2);
		expect(checkRateLimit('ip-1', cfg).remaining).toBe(1);
		expect(checkRateLimit('ip-1', cfg).remaining).toBe(0);
	});
	it('resets after window expires', () => {
		const cfg = { max: 2, windowMs: 1000 };
		expect(checkRateLimit('ip-1', cfg, 0).allowed).toBe(true);
		expect(checkRateLimit('ip-1', cfg, 0).allowed).toBe(true);
		expect(checkRateLimit('ip-1', cfg, 500).allowed).toBe(false);
		expect(checkRateLimit('ip-1', cfg, 1500).allowed).toBe(true);
	});
	it('isolates buckets per key', () => {
		const cfg = { max: 1, windowMs: 1000 };
		expect(checkRateLimit('ip-1', cfg).allowed).toBe(true);
		expect(checkRateLimit('ip-2', cfg).allowed).toBe(true);
		expect(checkRateLimit('ip-1', cfg).allowed).toBe(false);
		expect(checkRateLimit('ip-2', cfg).allowed).toBe(false);
	});
});
