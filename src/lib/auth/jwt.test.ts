// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from './jwt';

const SECRET = 'this-is-a-test-secret-32-chars-min!';

describe('jwt session', () => {
	it('signs and verifies round-trip', async () => {
		const token = await signSession({ sub: 'parent-id', email: 'a@b.co' }, SECRET);
		const claims = await verifySession(token, SECRET);
		expect(claims.sub).toBe('parent-id');
		expect(claims.email).toBe('a@b.co');
	});

	it('rejects tampered token', async () => {
		const token = await signSession({ sub: 'parent-id', email: 'a@b.co' }, SECRET);
		const tampered = token.slice(0, -2) + 'XX';
		await expect(verifySession(tampered, SECRET)).rejects.toThrow();
	});

	it('rejects with wrong secret', async () => {
		const token = await signSession({ sub: 'parent-id', email: 'a@b.co' }, SECRET);
		await expect(
			verifySession(token, 'a-different-secret-of-32-chars-mn!')
		).rejects.toThrow();
	});

	it('rejects expired token', async () => {
		const token = await signSession({ sub: 'parent-id', email: 'a@b.co' }, SECRET, -10);
		await expect(verifySession(token, SECRET)).rejects.toThrow();
	});

	it('refuses short secret', async () => {
		await expect(signSession({ sub: 'a', email: 'a@b.co' }, 'too-short')).rejects.toThrow();
	});
});
