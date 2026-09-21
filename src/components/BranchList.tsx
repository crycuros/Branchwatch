import React, { useState } from 'react';
import { Branch, BranchStatusType } from '@/lib/types';
import { BranchStatusBadge } from './ui/Badge';
import { GitBranch, GitCommit, Clock, ChevronRight, Shield } from 'lucide-react';

interface BranchListProps {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
  isLoading?: boolean;
}

export const BranchList: React.FC<BranchListProps> = ({
  branches,
  selectedBranch,
  onSelectBranch,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'all' | BranchStatusType>('all');

  const filteredBranches = branches.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const activeCount = branches.filter((b) => b.status === 'active').length;
  const quietCount = branches.filter((b) => b.status === 'quiet').length;
  const staleCount = branches.filter((b) => b.status === 'stale').length;

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span>Branches</span>
          <span className="text-xs font-normal text-neutral-400">({branches.length})</span>
        </h2>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-2xl text-xs font-medium text-neutral-600 dark:text-neutral-400 self-start sm:self-auto border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 apple-press ${
              filter === 'all'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All ({branches.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 apple-press ${
              filter === 'active'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('quiet')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 apple-press ${
              filter === 'quiet'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Quiet ({quietCount})
          </button>
          <button
            onClick={() => setFilter('stale')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 apple-press ${
              filter === 'stale'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Stale ({staleCount})
          </button>
        </div>
      </div>

      {/* Table / List View with Frosted Glass Card */}
      <div className="rounded-2xl apple-glass-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06] text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-5">Branch</div>
          <div className="col-span-3 sm:col-span-4 hidden sm:block">Latest Commit</div>
          <div className="col-span-3 sm:col-span-1 text-center">Commits</div>
          <div className="col-span-3 sm:col-span-2 text-right">Last Activity</div>
        </div>

        {/* Rows with iPhone tactile tap response */}
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranch?.name === branch.name;
            return (
              <div
                key={branch.name}
                onClick={() => onSelectBranch(branch)}
                className={`grid grid-cols-12 items-center px-4 py-3.5 text-sm transition-all duration-200 cursor-pointer select-none group active:scale-[0.99] active:duration-75 ${
                  isSelected
                    ? 'bg-black/[0.06] dark:bg-white/[0.1] font-medium'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                {/* Branch name + status badge */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 pr-2">
                  <BranchStatusBadge status={branch.status} showText={false} />
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 truncate font-mono text-xs sm:text-sm">
                      {branch.name}
                    </span>
                    {branch.protected && (
                      <span title="Protected branch">
                        <Shield className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Latest commit message summary */}
                <div className="col-span-3 sm:col-span-4 hidden sm:block truncate text-xs text-neutral-600 dark:text-neutral-400 pr-4">
                  {branch.lastCommitMessage || 'Initial commit'}
                </div>

                {/* Commits count */}
                <div className="col-span-3 sm:col-span-1 text-center font-mono text-xs text-neutral-600 dark:text-neutral-400">
                  {branch.commitCount ?? 0}
                </div>

                {/* Last activity */}
                <div className="col-span-3 sm:col-span-2 text-right flex items-center justify-end gap-1.5 text-xs text-neutral-500 font-mono">
                  <span>{formatRelativeTime(branch.lastCommitDate)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-10 text-neutral-500 text-sm">
          No branches matching filter &ldquo;{filter}&rdquo;.
        </div>
      )}
    </div>
  );
};
