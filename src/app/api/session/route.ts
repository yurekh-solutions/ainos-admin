import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session');

  if (!adminSession) {
    return NextResponse.json({ user: null });
  }

  try {
    const session = JSON.parse(adminSession.value);
    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ user: null });
  }
}