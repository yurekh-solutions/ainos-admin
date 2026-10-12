'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Users, FileText, TrendingUp, Clock, CheckCircle2,
  XCircle, AlertCircle, Eye, LogOut, Shield
} from 'lucide-react';

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
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);
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
        fetch('/api/admin/companies?limit=5'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setRecentCompanies(companiesData.companies || []);
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
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
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

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-950 text-amber-300',
    docs_submitted: 'bg-blue-950 text-blue-300',
    under_review: 'bg-purple-950 text-purple-300',
    approved: 'bg-green-950 text-green-300',
    rejected: 'bg-red-950 text-red-300',
    suspended: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">AINOS Admin</h1>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/onboarding"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Company Approvals
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-950 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">{stats.totalCompanies}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Companies</p>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-950 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">{stats.pendingApprovals}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Pending Approvals</p>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">{stats.approvedCompanies}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Approved</p>
            </div>

            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-950 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">{stats.totalUsers}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Users</p>
            </div>
          </div>
        )}

        {/* Recent Companies */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Recent Companies</h2>
            <Link
              href="/admin/onboarding"
              className="text-sm text-purple-400 hover:text-purple-300 font-medium"
            >
              View All →
            </Link>
          </div>

          {recentCompanies.length === 0 ? (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No companies found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-[hsl(var(--border))] hover:border-purple-800 hover:bg-purple-950/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-950/50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[hsl(var(--foreground))]">{company.name}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{company.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[company.onboardingStatus] || 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                      }`}
                    >
                      {company.onboardingStatus.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/admin/onboarding?company=${company.id}`}
                      className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}