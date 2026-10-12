'use client';

import { Search, Bell, Command } from 'lucide-react';

interface TopBarProps {
  user: { email: string; name?: string } | null;
  title?: string;
  subtitle?: string;
}

export default function TopBar({ user, title = 'Overview', subtitle = 'Workspace' }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#2a2a35]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">{subtitle}</span>
          <span className="text-[hsl(var(--muted-foreground))]">/</span>
          <span className="text-white font-medium">{title}</span>
        </div>

        {/* Right: Search + Notifications + Avatar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search inquiries..."
              className="w-64 pl-9 pr-16 py-2 bg-[#1a1a24] border border-[#2a2a35] rounded-lg text-sm text-white placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-[#1a1a24] transition-colors">
            <Bell className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full"></span>
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}