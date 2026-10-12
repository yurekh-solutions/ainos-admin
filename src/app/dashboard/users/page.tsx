'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Mail, Calendar } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  companyId?: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user, page]);

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(perPage),
        page: String(page),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} pendingCount={stats?.pendingApprovals || 0} />

      <div className="ml-64">
        <TopBar user={user} title="Users" subtitle="Workspace" />

        <main className="p-6 max-w-[1600px]">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
              User Management
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">All Users</h1>
            <p className="text-[hsl(var(--muted-foreground))]">
              View and manage platform users.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <Users className="w-4 h-4" />
              <span>{total} total</span>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a35]" />
                    <div className="flex-1">
                      <div className="h-4 bg-[#2a2a35] rounded w-24 mb-2" />
                      <div className="h-3 bg-[#2a2a35] rounded w-32" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
                No users found
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl p-5 hover:border-purple-600/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>{u.role || 'user'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-white hover:bg-[#2a2a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-white hover:bg-[#2a2a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
