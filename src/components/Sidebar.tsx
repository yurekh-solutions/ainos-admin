'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, FileCheck, Users,
  HelpCircle, ChevronDown, Shield, X, Zap
} from 'lucide-react';

interface SidebarProps {
  user: { email: string; name?: string } | null;
  pendingCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/companies', label: 'Companies', icon: Building2, badge: true },
  { href: '/admin/onboarding', label: 'Approvals', icon: FileCheck },
  { href: '/admin/tools', label: 'Tools', icon: Zap },
  { href: '/dashboard/users', label: 'Users', icon: Users },
];

export default function Sidebar({ user, pendingCount = 0, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Close button (mobile) */}
      {onClose && (
        <div className="absolute top-4 right-4 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1a1a24] transition-colors"
          >
            <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
      )}

      {/* Workspace Selector */}
      <div className="p-4 border-b border-[#2a2a35]">
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a24] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin workspace</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">AINOS Platform</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[#1a1a24] hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-600/30 text-purple-300 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Help Card */}
      <div className="p-3">
        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Big ideas. Real progress.</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                A little clarity goes a long way. Your team is here to help.
              </p>
            </div>
          </div>
          <button className="text-xs text-purple-400 hover:text-purple-300 font-medium mt-2 flex items-center gap-1">
            Visit help center
            <span className="text-[10px]"></span>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-[#2a2a35]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              Workspace admin
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop: always visible fixed sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0f0f1a] border-r border-[#2a2a35] flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile: slide-in drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-72 bg-[#0f0f1a] border-r border-[#2a2a35] flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}