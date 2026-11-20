import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Signed, expiring admin session token.
 *
 * The session used to be a plain JSON string dropped into a cookie, which
 * anyone could copy, edit and resend: writing `{ "email": "<admin>" }` into
 * `admin_session` was enough to become an operator, and every /api/admin route
 * trusted it. The value is now an HMAC-signed envelope with an expiry, so a
 * forged or stale cookie simply fails verification.
 */

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // one working day, not a week

export interface SessionPayload {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
}

let ephemeralKey: string | undefined;

function signingKey(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (!ephemeralKey) {
    ephemeralKey = randomBytes(32).toString('hex');
    console.error(
      '[security] ADMIN_SESSION_SECRET/NEXTAUTH_SECRET is not set - using a random per-process key. ' +
      'Admin sessions will be invalidated on every restart, and multiple instances cannot share them.',
    );
  }
  return ephemeralKey;
}

function signature(body: string): string {
  return createHmac('sha256', signingKey()).update(body).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(payload: SessionPayload): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS }),
  ).toString('base64url');
  return `${body}.${signature(body)}`;
}

/** Returns the payload only when the signature matches and the token is live. */
export function readSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  if (!safeEqual(sig, signature(body))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload & { exp?: number };
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    if (!parsed.email) return null;
    return { id: parsed.id, email: parsed.email, name: parsed.name, role: parsed.role };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

/** Cookie attributes shared by the setter and the clearer so they cannot drift. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
