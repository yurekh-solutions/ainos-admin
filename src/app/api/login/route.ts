import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { clientIp, loginGate, releaseLogin, throttle } from '@/lib/security';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

const GENERIC_FAILURE = 'Invalid email or password';

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    // One shared budget per address first, so a script cannot spray the
    // password hash without ever naming a target.
    const throttled = throttle(request, 'login', 20, 15 * 60_000);
    if (throttled) return throttled;

    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const gate = loginGate(ip, String(email));
    if (!gate.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } }
      );
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    // Same answer as a wrong password: this endpoint must not confirm which
    // addresses hold an operator seat.
    if (!adminEmails.includes(email)) {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    // Verify password against stored hash
    const storedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!storedHash) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) {
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    // If admin email not in DB yet, auto-create so login succeeds
    let user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: email.split('@')[0], isAdmin: true },
        include: { company: true },
      });
    }

    // A correct password clears both budgets, so an operator who mistyped a
    // couple of times is never locked out of their own console.
    releaseLogin(ip, String(email));

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Signed and expiring: an edited or replayed cookie cannot name an
    // operator, and a stolen one stops working at the end of the day.
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken({ id: user.id, email: user.email, name: user.name, role: user.role }),
      sessionCookieOptions(60 * 60 * 8),
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}