import type { NextRequest } from 'next/server';

// Simple cookie-based session retrieval (replaces NextAuth getServerSession)
// Reads the admin_session cookie set by /api/login and returns a session-like object.

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  } | null;
}

export async function getServerSession(req: NextRequest): Promise<AdminSession | null> {
  const cookie = req.cookies.get('admin_session');
  if (!cookie?.value) return null;

  try {
    const parsed = JSON.parse(cookie.value);
    if (!parsed?.email) return null;
    return {
      user: {
        id: parsed.id,
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
      },
    };
  } catch {
    return null;
  }
}