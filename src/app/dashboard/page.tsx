'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, FileText, TrendingUp,
  Download, Plus, Calendar
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import PerformanceChart from '@/components/PerformanceChart';
import CompaniesTable from '@/components/CompaniesTable';
import ActivityFeed from '@/components/ActivityFeed';

interface DashboardStats {
  totalCompanies: number;
  pendingApprovals: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  totalUsers: number;
  totalDocuments: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      
      if (!data.user) {
        router.push('/login');
        return;
      }
      
      setUser(data.user);
      fetchDashboardData();
    } catch {
      router.push('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/companies?limit=10'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData.companies || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock activity data (replace with real API data later)
  const activities = [
    {
      id: '1',
      action: 'Company approved',
      description: 'for prime vision',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      icon: 'approved' as const,
    },
    {
      id: '2',
      action: 'Document verified',
      description: 'for Test Company Pvt Ltd',
      timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
      icon: 'document' as const,
    },
    {
      id: '3',
      action: 'New registration',
      description: 'Sonia Test Company submitted documents',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      icon: 'pending' as const,
    },
  ];

  // Generate sparkline data
  const sparklineData = [12, 19, 15, 25, 22, 30, 28, 35, 32, 38];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} pendingCount={stats?.pendingApprovals || 0} />
      
      <div className="ml-64">
        <TopBar user={user} title="Overview" subtitle="Workspace" />
        
        <main className="p-6 max-w-[1600px]">
          {/* Header Section */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
              Your Business, In Focus
            </p>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Good morning, {user?.name || 'Admin'}.
                </h1>
                <p className="text-[hsl(var(--muted-foreground))]">
                  Here's what's moving your business forward today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white hover:bg-[#2a2a35] transition-colors">
                  <Download className="w-4 h-4" />
                  Export report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg text-sm text-white hover:bg-purple-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  New consultation
                </button>
              </div>
            </div>
          </div>

          {/* Business Overview Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Business Overview
                </h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white hover:bg-[#2a2a35] transition-colors">
                <Calendar className="w-4 h-4" />
                This month
              </button>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  label="Total Companies"
                  value={stats.totalCompanies}
                  change={17.5}
                  icon={<Building2 className="w-6 h-6 text-blue-400" />}
                  sparklineData={sparklineData}
                />
                <StatCard
                  label="Pending Approvals"
                  value={stats.pendingApprovals}
                  change={24.1}
                  icon={<FileText className="w-6 h-6 text-amber-400" />}
                  sparklineData={sparklineData.map(v => v * 0.8)}
                />
                <StatCard
                  label="Approved"
                  value={stats.approvedCompanies}
                  change={17.6}
                  icon={<TrendingUp className="w-6 h-6 text-green-400" />}
                  sparklineData={sparklineData.map(v => v * 0.6)}
                />
                <StatCard
                  label="Total Users"
                  value={stats.totalUsers}
                  change={2.3}
                  icon={<Users className="w-6 h-6 text-purple-400" />}
                  sparklineData={sparklineData.map(v => v * 1.2)}
                />
              </div>
            )}

            {/* Performance Chart */}
            <div className="mb-8">
              <PerformanceChart />
            </div>

            {/* Companies Table + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CompaniesTable companies={companies} />
              </div>
              <div>
                <ActivityFeed activities={activities} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}