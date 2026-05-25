// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, verifyPasswordTimingSafeDummy } from './password';

describe('password hashing', () => {
	it('hashes and verifies round-trip', async () => {
		const hash = await hashPassword('hunter22hunter');
		expect(hash).not.toBe('hunter22hunter');
		expect(await verifyPassword('hunter22hunter', hash)).toBe(true);
	});

	it('rejects wrong password', async () => {
		const hash = await hashPassword('hunter22hunter');
		expect(await verifyPassword('nope-nope', hash)).toBe(false);
	});

	it('different hashes for same password (salt)', async () => {
		const a = await hashPassword('hunter22hunter');
		const b = await hashPassword('hunter22hunter');
		expect(a).not.toBe(b);
	});

	it('timing-safe dummy always returns false and does not throw', async () => {
		expect(await verifyPasswordTimingSafeDummy('anything')).toBe(false);
		expect(await verifyPasswordTimingSafeDummy('')).toBe(false);
	});

	it('timing-safe dummy takes a real bcrypt-compare amount of time', async () => {
		// First call warms the sentinel hash (slow). Measure the second call —
		// it should take meaningfully more than 5ms because bcrypt.compare with
		// cost 12 is intentionally slow. (Lower bound conservative for CI.)
		await verifyPasswordTimingSafeDummy('warmup');
		const t0 = performance.now();
		await verifyPasswordTimingSafeDummy('measure');
		const elapsed = performance.now() - t0;
		expect(elapsed).toBeGreaterThan(5);
	});
}, 30_000);
