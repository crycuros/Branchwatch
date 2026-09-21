import React from 'react';
import { Repository, Branch, ActivityItem } from '@/lib/types';
import { ChevronLeft, RefreshCw, GitBranch, GitCommit, Users, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { WhatChangedBanner } from './v3/WhatChangedBanner';

interface RepositoryHeaderProps {
  repo: Repository;
  onBackToRepos: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  branchCount: number;
  commitCount: number;
  contributorCount: number;
  branches?: Branch[];
  activities?: ActivityItem[];
  onOpenActivityView: () => void;
}

export const RepositoryHeader: React.FC<RepositoryHeaderProps> = ({
  repo,
  onBackToRepos,
  isRefreshing,
  onRefresh,
  branchCount,
  commitCount,
  contributorCount,
  branches = [],
  activities = [],
  onOpenActivityView,
}) => {
  return (
    <div className="space-y-6 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/70 font-sans">
      {/* Back link */}
      <button
        onClick={onBackToRepos}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors select-none"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Repository</span>
      </button>

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              <span className="font-normal text-neutral-400 dark:text-neutral-500">{repo.owner.login} / </span>
              {repo.name}
            </h1>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title="Open on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Updated recently
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* V3 "What Changed?" Activity Intelligence Banner with Live Repo Data */}
      <WhatChangedBanner branches={branches} activities={activities} onOpenActivityView={onOpenActivityView} />

      {/* Repository Metrics Summary */}
      <div className="flex items-center gap-8 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {branchCount}
          </span>
          <span className="text-xs font-medium text-neutral-500">branches</span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {commitCount}
          </span>
          <span className="text-xs font-medium text-neutral-500">commits</span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {contributorCount}
          </span>
          <span className="text-xs font-medium text-neutral-500">contributors</span>
        </div>
      </div>
    </div>
  );
};
