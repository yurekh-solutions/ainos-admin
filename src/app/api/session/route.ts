import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { readSessionToken, SESSION_COOKIE } from '@/lib/session';

export async function GET(request: NextRequest) {
  // Only a correctly signed, unexpired token describes a session. Anything
  // else - including the old unsigned JSON cookie - means nobody is signed in.
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ user: user ? { ...user } : null });
}
