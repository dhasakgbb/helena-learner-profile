import { describe, it, expect } from 'vitest';
import { credentialsSchema } from './auth';
import { childCreateSchema } from './children';
import { saveRunRequestSchema } from './runs';

describe('credentialsSchema', () => {
	it('accepts valid creds', () => {
		expect(credentialsSchema.parse({ email: 'a@b.co', password: 'hunter22hunter' })).toEqual({
			email: 'a@b.co',
			password: 'hunter22hunter'
		});
	});
	it('lowercases email', () => {
		const parsed = credentialsSchema.parse({ email: '  A@B.co ', password: 'longenoughpw' });
		expect(parsed.email).toBe('a@b.co');
	});
	it('rejects short password', () => {
		expect(() => credentialsSchema.parse({ email: 'a@b.co', password: 'short' })).toThrow();
	});
	it('rejects bad email', () => {
		expect(() => credentialsSchema.parse({ email: 'nope', password: 'hunter22hunter' })).toThrow();
	});
});

describe('childCreateSchema', () => {
	it('accepts valid child', () => {
		expect(childCreateSchema.parse({ display_name: 'Astrid', birth_year: 2015 })).toEqual({
			display_name: 'Astrid',
			birth_year: 2015
		});
	});
	it('rejects birth_year outside range', () => {
		expect(() =>
			childCreateSchema.parse({ display_name: 'Astrid', birth_year: 1990 })
		).toThrow();
	});
});

describe('saveRunRequestSchema', () => {
	it('rejects malformed payload', () => {
		expect(() => saveRunRequestSchema.parse({ child_id: 'not-uuid', payload: {} })).toThrow();
	});
});
