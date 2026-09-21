import React from 'react';
import { Branch, Commit } from '@/lib/types';
import { Button } from './ui/Button';
import { GitBranch, RefreshCw, GitCompare, ChevronLeft, Clock, ExternalLink, FileCode } from 'lucide-react';

interface CommitTimelineProps {
  branch: Branch;
  commits: Commit[];
  onBackToBranches: () => void;
  onSelectCommit: (commit: Commit) => void;
  onCompareWithMain: (branch: Branch) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const CommitTimeline: React.FC<CommitTimelineProps> = ({
  branch,
  commits,
  onBackToBranches,
  onSelectCommit,
  onCompareWithMain,
  isRefreshing,
  onRefresh,
}) => {
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Group commits by date (Today, Yesterday, Older)
  const groupCommits = (items: Commit[]) => {
    const groups: { [key: string]: Commit[] } = {
      TODAY: [],
      YESTERDAY: [],
      OLDER: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;

    items.forEach((c) => {
      const commitTime = new Date(c.commit?.author?.date || Date.now()).getTime();
      if (commitTime >= today) {
        groups.TODAY.push(c);
      } else if (commitTime >= yesterday) {
        groups.YESTERDAY.push(c);
      } else {
        groups.OLDER.push(c);
      }
    });

    return groups;
  };

  const grouped = groupCommits(commits);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Back button */}
      <button
        onClick={onBackToBranches}
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors select-none"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>All branches</span>
      </button>

      {/* Branch Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight font-mono text-neutral-900 dark:text-neutral-100">
              {branch.name}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              ● Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
            <span>{commits.length || branch.commitCount || 0} commits</span>
            <span>·</span>
            <span>Last updated {formatRelativeTime(branch.lastCommitDate)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onCompareWithMain(branch)}>
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Commit Activity Timeline */}
      <div className="space-y-8 pt-2">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          Commit Activity
        </h3>

        {Object.entries(grouped).map(([label, groupItems]) => {
          if (groupItems.length === 0) return null;
          return (
            <div key={label} className="space-y-4">
              <div className="text-[11px] font-semibold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
                {label}
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-neutral-200 dark:before:bg-neutral-800">
                {groupItems.map((item) => {
                  const authorName = item.commit?.author?.name || item.author?.login || 'Developer';
                  const avatar = item.author?.avatar_url || branch.lastCommitAuthor?.avatar_url;
                  return (
                    <div
                      key={item.sha}
                      onClick={() => onSelectCommit(item)}
                      className="relative group cursor-pointer apple-interactive"
                    >
                      {/* Timeline Node Bullet */}
                      <span className="absolute -left-[23px] top-3.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-neutral-900 border-2 border-neutral-400 dark:border-neutral-500 group-hover:border-neutral-900 dark:group-hover:border-white transition-colors" />

                      {/* Commit Card */}
                      <div className="p-4 rounded-xl apple-glass-card flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-900 dark:group-hover:text-white truncate">
                            {item.commit?.message}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            {avatar ? (
                              // eslint-disable-next-html-element-content
                              <img src={avatar} alt={authorName} className="w-4 h-4 rounded-full object-cover" />
                            ) : null}
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{authorName}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(item.commit?.author?.date)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            {item.sha.substring(0, 7)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
