'use client';

import { useState } from 'react';
import { Building2, Eye } from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  email: string;
  companyType: string;
  onboardingStatus: string;
  createdAt: string;
}

interface CompaniesTableProps {
  companies: Company[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-950 text-amber-300',
  docs_submitted: 'bg-blue-950 text-blue-300',
  under_review: 'bg-purple-950 text-purple-300',
  approved: 'bg-green-950 text-green-300',
  rejected: 'bg-red-950 text-red-300',
  suspended: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
};

const tabs = ['All', 'Pending', 'Approved', 'Rejected'];

export default function CompaniesTable({ companies }: CompaniesTableProps) {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? companies
    : companies.filter(c => c.onboardingStatus.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Recent Companies</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            New possibilities, ready for your next move.
          </p>
        </div>
        <Link
          href="/admin/onboarding"
          className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
        >
          View all companies
          <span className="text-xs"></span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#2a2a35]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-[hsl(var(--muted-foreground))] hover:text-white'
            }`}
          >
            {tab}
            {tab === 'Pending' && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600/30 text-purple-300 rounded-full">
                {companies.filter(c => c.onboardingStatus === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a35]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Name / Company
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Email
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Submitted
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No companies found</p>
                </td>
              </tr>
            ) : (
              filtered.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-[#2a2a35] hover:bg-[#0f0f1a] transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-950/50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{company.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-[hsl(var(--muted-foreground))]">
                    {company.email}
                  </td>
                  <td className="py-4 px-4 text-sm text-[hsl(var(--muted-foreground))] capitalize">
                    {company.companyType?.replace('_', ' ') || '-'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[company.onboardingStatus] || 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {company.onboardingStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-[hsl(var(--muted-foreground))]">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/admin/onboarding?company=${company.id}`}
                      className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors inline-block"
                    >
                      <Eye className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}