import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Full customer directory with per-company counters - operator data only.
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'all') {
      where.onboardingStatus = status;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              documents: true,
              users: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({ companies, total });
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
