import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Abuse defenses for the admin console. Everything here is additive: a signed-in
// operator keeps every capability, what changes is what an anonymous visitor or
// a scripted run can do against endpoints that read the whole platform.
//
// Counters live in process memory, so a redeploy resets them. That is enough for
// throttling scripted abuse; it is not a permanent ban list.

const isProd = process.env.NODE_ENV === 'production';

/** Render/Vercel put the client address in x-forwarded-for, first hop wins. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  return req.headers.get('x-real-ip') || 'unknown';
}

type Hits = number[];
const windows = new Map<string, Hits>();
const MAX_KEYS = 5_000;
let lastSweep = 0;

function sweep(windowMs: number): void {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const cutoff = now - Math.max(windowMs, 60_000);
  for (const [key, hits] of windows) {
    while (hits.length && hits[0] < cutoff) hits.shift();
    if (!hits.length) windows.delete(key);
  }
}

/**
 * Consumes one slot of `limit` per `windowMs` for a key. Sliding window, so a
 * burst costs one array and cannot grow forever.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(windowMs);

  let hits = windows.get(key);
  if (!hits) {
    if (windows.size >= MAX_KEYS) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
    hits = [];
    windows.set(key, hits);
  }

  while (hits.length && hits[0] <= now - windowMs) hits.shift();

  if (hits.length >= limit) {
    const retryAfterMs = hits[0] + windowMs - now;
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  hits.push(now);
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/**
 * Route-level budget: returns the 429 to send, or null when the call may
 * proceed.
 *
 *   const blocked = throttle(req, 'admin-login', 10, 15 * 60_000);
 *   if (blocked) return blocked;
 */
export function throttle(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const hit = rateLimit(`ip:${scope}:${clientIp(req)}`, limit, windowMs);
  if (hit.ok) return null;
  return NextResponse.json(
    { error: 'Too many attempts from this address. Please wait and try again.' },
    { status: 429, headers: { 'Retry-After': String(hit.retryAfterSeconds) } },
  );
}

// Two axes on the password gate: the address being attacked, and the account
// being targeted. A correct password clears both, so an operator who mistyped a
// couple of times is never locked out of their own console.
const IP_ATTEMPT_LIMIT = 15;
const IP_ATTEMPT_WINDOW_MS = 15 * 60_000;
const ACCT_ATTEMPT_LIMIT = 8;
const ACCT_ATTEMPT_WINDOW_MS = 15 * 60_000;

export function loginGate(ip: string, email: string): { allowed: boolean; retryAfterSeconds: number } {
  const target = email ? email.toLowerCase() : 'unknown';
  const ipWindow = rateLimit(`login:ip:${ip}`, IP_ATTEMPT_LIMIT, IP_ATTEMPT_WINDOW_MS);
  const acctWindow = rateLimit(`login:acct:${target}`, ACCT_ATTEMPT_LIMIT, ACCT_ATTEMPT_WINDOW_MS);
  if (ipWindow.ok && acctWindow.ok) return { allowed: true, retryAfterSeconds: 0 };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(ipWindow.retryAfterSeconds, acctWindow.retryAfterSeconds),
  };
}

export function releaseLogin(ip: string, email: string): void {
  windows.delete(`login:ip:${ip}`);
  windows.delete(`login:acct:${(email || '').toLowerCase()}`);
}

/** Bodies large enough to be a payload dump rather than an admin form. */
export const MAX_BODY_BYTES = 5 * 1024 * 1024;

export function bodyTooLarge(req: NextRequest): boolean {
  return Number(req.headers.get('content-length') || '0') > MAX_BODY_BYTES;
}

/**
 * Scanner probes for other stacks (.env, wp-login.php, phpmyadmin…) can never be
 * a real user of this console. Nothing here touches the app's own routes, and
 * the admin UI is not indexed, so the answer is a plain 404.
 */
const PROBE_PATHS =
  /(^|\/)(\.env(\.|$)|wp-login\.php|wp-admin|xmlrpc\.php|phpmyadmin|pma|cgi-bin|shell|sh\.php|cmd\.php|\.git\/|web\.config|\.aws\/|id_rsa|etc\/passwd)/i;

const HOSTILE_AGENTS =
  /(sqlmap|nikto|nmap|masscan|zgrab|acunetix|nessus|openvas|dirbuster|gobuster|wfuzz|hydra|medusa|wpscan|nuclei)/i;

export function isProbeRequest(req: NextRequest): boolean {
  const { pathname, search } = req.nextUrl;
  if (PROBE_PATHS.test(pathname) || PROBE_PATHS.test(search)) return true;
  if (/(\.\.\/|%2e%2e%2f|union\+select|union%20select|<script|onerror=)/i.test(pathname + search)) return true;
  return HOSTILE_AGENTS.test(req.headers.get('user-agent') || '');
}

export function rejectedProbe(): NextResponse {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/** True only outside production, for surfaces that must never answer when live. */
export function isDevSurface(): boolean {
  return !isProd;
}
