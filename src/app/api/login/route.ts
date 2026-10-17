import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    if (!adminEmails.includes(email)) {
      return NextResponse.json(
        { error: 'Not an admin user' },
        { status: 403 }
      );
    }

    // If admin email not in DB yet, auto-create so login succeeds
    let user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: email.split('@')[0], isAdmin: true },
        include: { company: true },
      });
    }

    // Create session cookie (simple implementation)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set admin session cookie
    response.cookies.set('admin_session', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}