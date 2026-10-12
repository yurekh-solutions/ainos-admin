'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  sparklineData?: number[];
}

function Sparkline({ data, color = '#7c3aed' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#gradient-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatCard({ label, value, change, icon, sparklineData }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-2xl p-6 hover:border-purple-600/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-950/50 flex items-center justify-center">
          {icon}
        </div>
        {sparklineData && (
          <div className="flex-shrink-0">
            <Sparkline data={sparklineData} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
        <div className="flex items-end gap-3">
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        {change !== undefined && (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            vs. previous month
          </p>
        )}
      </div>
    </div>
  );
}