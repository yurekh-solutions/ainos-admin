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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    docs_submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AINOS Admin</h1>
                <p className="text-xs text-gray-500">{user?.email}</p>
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
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCompanies}</h3>
              <p className="text-sm text-gray-500">Total Companies</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingApprovals}</h3>
              <p className="text-sm text-gray-500">Pending Approvals</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.approvedCompanies}</h3>
              <p className="text-sm text-gray-500">Approved</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        )}

        {/* Recent Companies */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
            <Link
              href="/admin/onboarding"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All →
            </Link>
          </div>

          {recentCompanies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No companies found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-500">{company.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[company.onboardingStatus] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {company.onboardingStatus.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/admin/onboarding?company=${company.id}`}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
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