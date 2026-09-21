import React, { useState } from 'react';
import { Branch, ActivityItem } from '@/lib/types';
import { Sparkles, GitBranch, GitCommit, FileCode, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface WhatChangedBannerProps {
  branches?: Branch[];
  activities?: ActivityItem[];
  onOpenActivityView: () => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const WhatChangedBanner: React.FC<WhatChangedBannerProps> = ({
  branches = [],
  activities = [],
  onOpenActivityView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map real branches dynamically
  const updatedBranches = branches.slice(0, 4).map((b) => ({
    name: b.name,
    commitsCount: b.commitCount ?? 0,
    time: formatRelativeTime(b.lastCommitDate),
    lastMessage: b.lastCommitMessage || 'No commit message',
  }));

  const totalBranchesCount = branches.length;
  const totalCommitsCount = activities.length > 0 ? activities.length : branches.reduce((acc, b) => acc + (b.commitCount ?? 0), 0);

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl apple-glass-card p-4 sm:p-5 space-y-4 font-sans transition-all duration-200">
      {/* Top Main Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 border border-black/[0.06] dark:border-white/[0.08]">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 tracking-tight">
                What changed?
              </h3>
              <span className="text-xs font-mono text-neutral-400">Recent activity</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {totalBranchesCount} {totalBranchesCount === 1 ? 'branch' : 'branches'} tracked · {totalCommitsCount} {totalCommitsCount === 1 ? 'commit' : 'commits'} logged across the repository
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all duration-150 apple-press"
          >
            <span>{isExpanded ? 'Hide details' : 'Branch summary'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenActivityView}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-150 shadow-sm apple-press"
          >
            <span>Inspect Activity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Branch Breakdown Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {updatedBranches.map((b) => (
          <div
            key={b.name}
            onClick={onOpenActivityView}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer apple-interactive"
          >
            <GitBranch className="w-3.5 h-3.5 text-neutral-400 font-mono" />
            <span className="font-mono">{b.name}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/[0.06] dark:bg-white/[0.08] font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              +{b.commitsCount} {b.commitsCount === 1 ? 'commit' : 'commits'}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded Accordion Details */}
      {isExpanded && (
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5 text-xs animate-fade-in">
          {updatedBranches.map((b) => (
            <div
              key={b.name}
              className="p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/30 border border-neutral-200/40 dark:border-neutral-800/50 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                  {b.name}
                </div>
                <div className="text-neutral-500">
                  Updated {b.time} · {b.lastMessage}
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <span>{b.commitsCount} commits</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
