'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, Search, Plus, Pencil, Trash2, X, Loader2, Check,
  Power, Coins, AlertCircle, RefreshCw,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  creditCost: number;
  isActive: boolean;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ToolDraft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  creditCost: string;
  isActive: boolean;
}

const EMPTY_DRAFT: ToolDraft = {
  name: '',
  slug: '',
  description: '',
  category: 'ai',
  creditCost: '1',
  isActive: true,
};

const CATEGORIES = ['ai', 'marketing', 'crm', 'finance', 'productivity', 'operations'];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminToolsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [stats, setStats] = useState<{ pendingApprovals?: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [category, setCategory] = useState('all');

  const [draft, setDraft] = useState<ToolDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const showToast = (msg: string, type: 'error' | 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
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
  }, [router]);

  const fetchTools = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      if (category !== 'all') params.set('category', category);

      const res = await fetch(`/api/admin/tools?${params.toString()}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not load tools', 'error');
        return;
      }
      setTools(data.tools || []);
      setTotal(data.total || 0);
      setActiveCount(data.active || 0);
    } catch {
      showToast('Could not load tools', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status, category, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) fetchTools();
  }, [user, fetchTools]);

  const openCreate = () => {
    setFormError(null);
    setDraft({ ...EMPTY_DRAFT });
  };

  const openEdit = (tool: Tool) => {
    setFormError(null);
    setDraft({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description || '',
      category: tool.category || 'ai',
      creditCost: String(tool.creditCost),
      isActive: tool.isActive,
    });
  };

  const saveDraft = async () => {
    if (!draft) return;
    setFormError(null);

    if (!draft.name.trim()) {
      setFormError('Tool name is required');
      return;
    }
    const slug = slugify(draft.slug || draft.name);
    if (!slug) {
      setFormError('Enter a valid slug (letters, numbers, dashes)');
      return;
    }
    const creditCost = Number(draft.creditCost);
    if (!Number.isFinite(creditCost) || creditCost < 0) {
      setFormError('Credit cost must be zero or a positive number');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        slug,
        description: draft.description.trim(),
        category: draft.category,
        creditCost: Math.floor(creditCost),
        isActive: draft.isActive,
      };

      const res = await fetch(draft.id ? `/api/admin/tools/${draft.id}` : '/api/admin/tools', {
        method: draft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Could not save tool');
        return;
      }

      showToast(draft.id ? 'Tool updated' : 'Tool created', 'success');
      setDraft(null);
      await fetchTools('refresh');
    } catch {
      setFormError('Could not save tool');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tool: Tool) => {
    setBusyId(tool.id);
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !tool.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not update tool', 'error');
        return;
      }
      setTools(prev => prev.map(t => (t.id === tool.id ? { ...t, isActive: data.isActive } : t)));
      setActiveCount(prev => (data.isActive ? prev + 1 : Math.max(0, prev - 1)));
      showToast(`${tool.name} ${data.isActive ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      showToast('Could not update tool', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeTool = async (tool: Tool) => {
    if (deletingId !== tool.id) {
      setDeletingId(tool.id);
      return;
    }

    setBusyId(tool.id);
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not delete tool', 'error');
        return;
      }
      showToast(`${tool.name} deleted`, 'success');
      setDeletingId(null);
      await fetchTools('refresh');
    } catch {
      showToast('Could not delete tool', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(tools.map(t => t.category).filter(Boolean) as string[]))];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar user={user} pendingCount={stats?.pendingApprovals || 0} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <TopBar user={user} title="Tools" subtitle="Platform" onMenuToggle={() => setSidebarOpen(true)} />

        <main className="p-6 max-w-[1600px]">
          {toast && (
            <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg border text-sm shadow-lg ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-800 text-red-200'
                : 'bg-green-950/90 border-green-800 text-green-200'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Tool catalogue</p>
              <h1 className="text-3xl font-bold text-white mb-2">Tools management</h1>
              <p className="text-[hsl(var(--muted-foreground))]">
                Every tool listed in the marketplace. Disabled tools disappear from the dashboard instantly.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New tool
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">In catalogue</p>
              <p className="text-2xl font-bold text-white">{total}</p>
            </div>
            <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Active</p>
              <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            </div>
            <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Disabled</p>
              <p className="text-2xl font-bold text-amber-400">{Math.max(0, total - activeCount)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Search by name, slug or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                    status === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a24] text-[hsl(var(--muted-foreground))] border border-[#2a2a35] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="px-3 py-2 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-xs text-white capitalize focus:outline-none focus:border-purple-500/50"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => fetchTools('refresh')}
                disabled={refreshing}
                className="p-2 rounded-lg bg-[#1a1a24] border border-[#2a2a35] text-[hsl(var(--muted-foreground))] hover:text-white transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-[#23232f] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-16">
                <Zap className="w-10 h-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3 opacity-50" />
                <p className="text-white font-medium mb-1">No tools match these filters</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Adjust the search or create a new tool.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2a35]">
                {tools.map(tool => (
                  <div key={tool.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-[#1f1f2b] transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tool.isActive ? 'bg-purple-600/20 text-purple-400' : 'bg-[#23232f] text-[hsl(var(--muted-foreground))]'
                      }`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">{tool.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            tool.isActive
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {tool.isActive ? 'Active' : 'Disabled'}
                          </span>
                          {tool.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#23232f] text-[hsl(var(--muted-foreground))] capitalize">
                              {tool.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5 truncate">/{tool.slug}</p>
                        {tool.description && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">{tool.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        {tool.creditCost}
                      </span>
                      <button
                        onClick={() => toggleActive(tool)}
                        disabled={busyId === tool.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                          tool.isActive
                            ? 'border-[#2a2a35] text-[hsl(var(--muted-foreground))] hover:text-white'
                            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {busyId === tool.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                        {tool.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => openEdit(tool)}
                        className="p-2 rounded-lg border border-[#2a2a35] text-[hsl(var(--muted-foreground))] hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeTool(tool)}
                        onBlur={() => { if (deletingId === tool.id) setDeletingId(null); }}
                        disabled={busyId === tool.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
                          deletingId === tool.id
                            ? 'border-red-500 bg-red-500/10 text-red-400'
                            : 'border-[#2a2a35] text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:border-red-500/40'
                        }`}
                        title={deletingId === tool.id ? 'Click again to confirm' : 'Delete'}
                      >
                        {busyId === tool.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {deletingId === tool.id && 'Confirm'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4">
            Tool execution logic is registered in code by slug. A new row only appears in the marketplace once a matching
            handler exists, so disabling is safer than deleting a live tool.
          </p>
        </main>
      </div>

      {/* Create / edit modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !saving && setDraft(null)}>
          <div className="w-full max-w-lg bg-[#14141d] border border-[#2a2a35] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a35]">
              <h2 className="text-lg font-semibold text-white">{draft.id ? 'Edit tool' : 'New tool'}</h2>
              <button onClick={() => !saving && setDraft(null)} className="text-[hsl(var(--muted-foreground))] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Name</label>
                <input
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })}
                  placeholder="AI Content Writer"
                  className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Slug</label>
                  <input
                    value={draft.slug}
                    onChange={e => setDraft({ ...draft, slug: slugify(e.target.value) })}
                    placeholder="ai-content-writer"
                    className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white font-mono placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:border-purple-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Category</label>
                  <select
                    value={draft.category}
                    onChange={e => setDraft({ ...draft, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white capitalize focus:outline-none focus:border-purple-500/60"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Description</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft({ ...draft, description: e.target.value })}
                  rows={3}
                  placeholder="What this tool does for the customer"
                  className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-[hsl(var(--muted-foreground))] resize-none focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Credit cost</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.creditCost}
                    onChange={e => setDraft({ ...draft, creditCost: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/60"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={e => setDraft({ ...draft, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-[#2a2a35] bg-[#1a1a24] accent-purple-600"
                    />
                    Visible in marketplace
                  </label>
                </div>
              </div>

              {formError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#2a2a35]">
              <button
                onClick={() => setDraft(null)}
                disabled={saving}
                className="px-4 py-2.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {draft.id ? 'Save changes' : 'Create tool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
