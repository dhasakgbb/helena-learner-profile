import bcrypt from 'bcryptjs';

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

/**
 * A real bcrypt hash of a sentinel string, computed once at module load. Use this
 * to keep wall-clock time consistent for "email not found" vs "wrong password"
 * paths so the auth endpoint cannot leak which case it is by timing.
 *
 * The sentinel itself is never a valid password (40+ chars of random) so it
 * cannot accidentally authenticate any real account.
 */
const TIMING_SAFE_SENTINEL = '__no_such_account_timing_safe_sentinel_v1__';
let _sentinelHashPromise: Promise<string> | null = null;

function sentinelHash(): Promise<string> {
	if (!_sentinelHashPromise) {
		_sentinelHashPromise = bcrypt.hash(TIMING_SAFE_SENTINEL, COST);
	}
	return _sentinelHashPromise;
}

/**
 * Run a real bcrypt.compare against a fixed sentinel hash so that callers can
 * make their "user not found" branch take roughly the same time as a real
 * "wrong password" branch. Always returns false.
 */
export async function verifyPasswordTimingSafeDummy(password: string): Promise<false> {
	const hash = await sentinelHash();
	await bcrypt.compare(password, hash);
	return false;
}
