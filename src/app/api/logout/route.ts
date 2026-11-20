import { NextResponse } from 'next/server';
import { sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear admin session cookie, with the same attributes it was set with so
  // the browser actually matches and drops it.
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));

  return response;
}