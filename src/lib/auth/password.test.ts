import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

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
}, 30_000);
