type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
	max: number;
	windowMs: number;
};

export const DEFAULT_LOGIN_LIMIT: RateLimitConfig = {
	max: 5,
	windowMs: 15 * 60 * 1000
};

export type RateLimitResult = {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
};

export function checkRateLimit(
	key: string,
	cfg: RateLimitConfig = DEFAULT_LOGIN_LIMIT,
	now = Date.now()
): RateLimitResult {
	const existing = buckets.get(key);
	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + cfg.windowMs });
		return { allowed: true, remaining: cfg.max - 1, retryAfterSeconds: 0 };
	}
	if (existing.count >= cfg.max) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000)
		};
	}
	existing.count += 1;
	return {
		allowed: true,
		remaining: cfg.max - existing.count,
		retryAfterSeconds: 0
	};
}

export function _resetRateLimit() {
	buckets.clear();
}
