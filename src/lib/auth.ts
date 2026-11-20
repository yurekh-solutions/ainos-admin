import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readSessionToken, SESSION_COOKIE } from '@/lib/session';
import { isAdmin } from '@/lib/admin';

// Cookie-based session retrieval. The cookie is an HMAC-signed, expiring
// envelope (see src/lib/session.ts); an unsigned or tampered value is treated
// as no session at all rather than being parsed for parts.

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
  } | null;
}

export async function getServerSession(req: NextRequest): Promise<AdminSession | null> {
  const payload = readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!payload?.email) return null;
  return {
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    },
  };
}

/**
 * Single gate for every endpoint that reads or writes the whole platform.
 *
 *   const denied = await requireAdmin(req);
 *   if (denied) return denied;
 *
 * The email is re-checked against ADMIN_EMAILS on each call, so removing an
 * address from the allow-list invalidates that operator's existing session too.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(req);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
