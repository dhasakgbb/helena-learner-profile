import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
	if (_db) return _db;
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}
	_client = postgres(env.DATABASE_URL, { prepare: false });
	_db = drizzle(_client, { schema });
	return _db;
}

export { schema };
