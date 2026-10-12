'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface PerformanceChartProps {
  currentMonthData?: number[];
  lastMonthData?: number[];
  labels?: string[];
}

export default function PerformanceChart({
  currentMonthData = [12, 19, 15, 25, 22, 30, 28, 35, 32, 38, 36, 42, 40, 45, 43, 48, 46, 50, 48, 52, 50, 55, 53, 58, 56, 60, 58, 62, 60, 65],
  lastMonthData = [10, 15, 12, 20, 18, 25, 23, 28, 26, 32, 30, 35, 33, 38, 36, 40, 38, 42, 40, 44, 42, 46, 44, 48, 46, 50, 48, 52, 50, 54],
  labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`)
}: PerformanceChartProps) {
  const [dateRange, setDateRange] = useState('This month');

  const max = Math.max(...currentMonthData, ...lastMonthData);
  const width = 800;
  const height = 300;
  const padding = 40;

  const getX = (index: number) => padding + (index / (currentMonthData.length - 1)) * (width - padding * 2);
  const getY = (value: number) => height - padding - (value / max) * (height - padding * 2);

  const currentPath = currentMonthData.map((value, index) => `${getX(index)},${getY(value)}`).join(' L ');
  const lastPath = lastMonthData.map((value, index) => `${getX(index)},${getY(value)}`).join(' L ');

  const currentArea = `M ${currentPath} L ${getX(currentMonthData.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Company Registrations</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            A clearer picture of your growing pipeline.
          </p>
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0f0f1a] border border-[#2a2a35] rounded-lg text-sm text-white hover:bg-[#2a2a35] transition-colors">
            <Calendar className="w-4 h-4" />
            <span>{dateRange}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">This month</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/50"></div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Last month</span>
        </div>
      </div>

      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i / 4) * (height - padding * 2);
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#2a2a35"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Last month line */}
          <path
            d={`M ${lastPath}`}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.4"
          />

          {/* Current month area */}
          <path d={currentArea} fill="url(#chartGradient)" />

          {/* Current month line */}
          <path
            d={`M ${currentPath}`}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X-axis labels */}
          {[0, 7, 14, 21, 29].map((i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-[hsl(var(--muted-foreground))]"
            >
              {labels[i]}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-purple-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>Your pipeline is picking up. Technology inquiries lead growth this month.</span>
      </div>
    </div>
  );
}