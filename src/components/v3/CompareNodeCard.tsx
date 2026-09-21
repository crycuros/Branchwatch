import React from 'react';
import { GitCompare, Plus, Minus, ArrowRight, FileCode } from 'lucide-react';

interface CompareNodeCardProps {
  sourceBranch: string;
  targetBranch: string;
  uniqueCommits: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  onSelect: () => void;
}

export const CompareNodeCard: React.FC<CompareNodeCardProps> = ({
  sourceBranch,
  targetBranch,
  uniqueCommits,
  filesChanged,
  additions,
  deletions,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-apple dark:shadow-apple-dark w-72 space-y-3 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-all select-none"
    >
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
          <GitCompare className="w-4 h-4 text-purple-500" />
          <span>Compare Node</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
          Diff
        </span>
      </div>

      <div className="flex items-center justify-between font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        <span>{sourceBranch}</span>
        <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
        <span>{targetBranch}</span>
      </div>

      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 grid grid-cols-2 gap-2 text-center text-xs">
        <div>
          <div className="font-bold font-mono text-neutral-900 dark:text-neutral-100">{uniqueCommits}</div>
          <div className="text-[10px] text-neutral-500">unique commits</div>
        </div>

        <div>
          <div className="font-bold font-mono text-neutral-900 dark:text-neutral-100">{filesChanged}</div>
          <div className="text-[10px] text-neutral-500">files changed</div>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-xs font-bold pt-1">
        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
          <Plus className="w-3.5 h-3.5" />
          {additions.toLocaleString()}
        </span>
        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
          <Minus className="w-3.5 h-3.5" />
          {deletions.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
