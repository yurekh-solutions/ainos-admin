import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalCompanies,
      pendingApprovals,
      approvedCompanies,
      rejectedCompanies,
      totalUsers,
      totalDocuments,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({
        where: {
          onboardingStatus: { in: ['pending', 'docs_submitted', 'under_review'] },
        },
      }),
      prisma.company.count({
        where: { onboardingStatus: 'approved' },
      }),
      prisma.company.count({
        where: { onboardingStatus: 'rejected' },
      }),
      prisma.user.count(),
      prisma.document.count(),
    ]);

    return NextResponse.json({
      totalCompanies,
      pendingApprovals,
      approvedCompanies,
      rejectedCompanies,
      totalUsers,
      totalDocuments,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}