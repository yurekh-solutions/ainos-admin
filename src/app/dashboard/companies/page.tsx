'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Search, Filter, Eye } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

interface Company {
  id: string;
  name: string;
  email?: string;
  onboardingStatus: string;
  industry?: string;
  createdAt: string;
  _count: {
    documents: number;
    users: number;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-950 text-amber-300 border-amber-800',
  docs_submitted: 'bg-blue-950 text-blue-300 border-blue-800',
  under_review: 'bg-purple-950 text-purple-300 border-purple-800',
  approved: 'bg-green-950 text-green-300 border-green-800',
  rejected: 'bg-red-950 text-red-300 border-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  docs_submitted: 'Docs Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) fetchCompanies();
  }, [user, filter, page]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/session');
      const data = await response.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      router.push('/login');
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(perPage),
        page: String(page),
      });
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/companies?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / perPage);

  const tabs = [
    { id: 'all', label: 'All Companies' },
    { id: 'pending', label: 'Pending' },
    { id: 'docs_submitted', label: 'Docs Submitted' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} pendingCount={stats?.pendingApprovals || 0} />

      <div className="ml-64">
        <TopBar user={user} title="Companies" subtitle="Workspace" />

        <main className="p-6 max-w-[1600px]">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
              Company Management
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">All Companies</h1>
            <p className="text-[hsl(var(--muted-foreground))]">
              Manage and review company registrations.
            </p>
          </div>

          {/* Search + Filter Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <Filter className="w-4 h-4" />
              <span>{total} total</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-[#2a2a35]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilter(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  filter === tab.id
                    ? 'text-purple-400'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-white'
                }`}
              >
                {tab.label}
                {filter === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a35]">
                    <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Company
                    </th>
                    <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Industry
                    </th>
                    <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Users
                    </th>
                    <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Documents
                    </th>
                    <th className="text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Registered
                    </th>
                    <th className="text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                        Loading companies...
                      </td>
                    </tr>
                  ) : filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                        No companies found
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-[#2a2a35]/50 hover:bg-[#2a2a35]/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{company.name}</p>
                              {company.email && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{company.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${
                              statusColors[company.onboardingStatus] || 'bg-gray-800 text-gray-300 border-gray-700'
                            }`}
                          >
                            {statusLabels[company.onboardingStatus] || company.onboardingStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                          {company.industry || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {company._count?.users || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {company._count?.documents || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                          {new Date(company.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => router.push(`/admin/onboarding?company=${company.id}`)}
                            className="p-2 rounded-lg hover:bg-[#2a2a35] transition-colors text-[hsl(var(--muted-foreground))] hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a35]">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm bg-[#0f0f1a] border border-[#2a2a35] rounded-lg text-white hover:bg-[#2a2a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm bg-[#0f0f1a] border border-[#2a2a35] rounded-lg text-white hover:bg-[#2a2a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
