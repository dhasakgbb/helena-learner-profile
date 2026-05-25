import { SignJWT, jwtVerify } from 'jose';

export type SessionClaims = {
	sub: string;
	email: string;
};

function secret(jwtSecret: string): Uint8Array {
	if (jwtSecret.length < 32) {
		throw new Error('JWT_SECRET must be at least 32 characters');
	}
	return new TextEncoder().encode(jwtSecret);
}

export async function signSession(
	claims: SessionClaims,
	jwtSecret: string,
	expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	return new SignJWT({ email: claims.email })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(claims.sub)
		.setIssuedAt(now)
		.setExpirationTime(now + expiresInSeconds)
		.sign(secret(jwtSecret));
}

export async function verifySession(token: string, jwtSecret: string): Promise<SessionClaims> {
	const { payload } = await jwtVerify(token, secret(jwtSecret));
	if (!payload.sub) throw new Error('No subject in token');
	if (typeof payload.email !== 'string') throw new Error('No email in token');
	return { sub: payload.sub, email: payload.email };
}
