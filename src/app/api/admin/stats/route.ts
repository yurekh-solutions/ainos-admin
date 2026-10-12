import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Current stats
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

    // Previous month stats for percentage changes
    const [
      prevMonthCompanies,
      prevMonthPending,
      prevMonthApproved,
      prevMonthUsers,
    ] = await Promise.all([
      prisma.company.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.company.count({
        where: {
          onboardingStatus: { in: ['pending', 'docs_submitted', 'under_review'] },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.company.count({
        where: {
          onboardingStatus: 'approved',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
    ]);

    // This month stats
    const [
      thisMonthCompanies,
      thisMonthPending,
      thisMonthApproved,
      thisMonthUsers,
    ] = await Promise.all([
      prisma.company.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
      prisma.company.count({
        where: {
          onboardingStatus: { in: ['pending', 'docs_submitted', 'under_review'] },
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.company.count({
        where: {
          onboardingStatus: 'approved',
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
    ]);

    // Time-series data for chart (last 30 days)
    const dailyRegistrations = await prisma.company.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by day
    const dailyData: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }

    dailyRegistrations.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr] += item._count.id;
      }
    });

    const chartData = Object.values(dailyData);

    // Last month daily data for comparison
    const lastMonthDailyRegistrations = await prisma.company.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const lastMonthDailyData: Record<string, number> = {};
    const daysInLastMonth = lastMonthEnd.getDate();
    for (let i = 1; i <= daysInLastMonth; i++) {
      const date = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), i);
      const dateStr = date.toISOString().split('T')[0];
      lastMonthDailyData[dateStr] = 0;
    }

    lastMonthDailyRegistrations.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      if (lastMonthDailyData[dateStr] !== undefined) {
        lastMonthDailyData[dateStr] += item._count.id;
      }
    });

    const lastMonthChartData = Object.values(lastMonthDailyData);

    // Recent activity from companies, users, documents
    const [recentCompanies, recentUsers, recentDocuments] = await Promise.all([
      prisma.company.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, onboardingStatus: true, createdAt: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, category: true, createdAt: true },
      }),
    ]);

    // Build activity feed
    const activities = [
      ...recentCompanies.map((c) => ({
        id: `company-${c.id}`,
        action: c.onboardingStatus === 'approved' ? 'Company approved' :
                c.onboardingStatus === 'rejected' ? 'Company rejected' :
                'New company registered',
        description: c.name,
        timestamp: c.createdAt.toISOString(),
        icon: c.onboardingStatus === 'approved' ? 'approved' as const :
              c.onboardingStatus === 'rejected' ? 'rejected' as const : 'pending' as const,
      })),
      ...recentUsers.map((u) => ({
        id: `user-${u.id}`,
        action: 'New user registered',
        description: u.name || u.email,
        timestamp: u.createdAt.toISOString(),
        icon: 'pending' as const,
      })),
      ...recentDocuments.map((d) => ({
        id: `doc-${d.id}`,
        action: 'Document uploaded',
        description: d.name,
        timestamp: d.createdAt.toISOString(),
        icon: 'document' as const,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return NextResponse.json({
      totalCompanies,
      pendingApprovals,
      approvedCompanies,
      rejectedCompanies,
      totalUsers,
      totalDocuments,
      changes: {
        companies: calcChange(thisMonthCompanies, prevMonthCompanies),
        pending: calcChange(thisMonthPending, prevMonthPending),
        approved: calcChange(thisMonthApproved, prevMonthApproved),
        users: calcChange(thisMonthUsers, prevMonthUsers),
      },
      chartData,
      lastMonthChartData,
      activities,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}