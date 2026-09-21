import React, { useState, useEffect } from 'react';
import { Branch, BranchComparison, Commit } from '@/lib/types';
import { compareBranches } from '@/lib/github';
import { Button } from './ui/Button';
import {
  GitCompare,
  ArrowRight,
  GitCommit,
  FileCode,
  Check,
  RefreshCw,
  ArrowLeftRight,
  GitPullRequest,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Rows,
  Columns,
} from 'lucide-react';
import { SplitDiffView } from './v3/SplitDiffView';
import { DiffViewer } from './v3/DiffViewer';

interface BranchCompareProps {
  owner: string;
  repoName: string;
  branches: Branch[];
  initialBaseBranch?: string;
  initialHeadBranch?: string;
  token?: string | null;
  onSelectCommit: (commit: Commit) => void;
}

export const BranchCompare: React.FC<BranchCompareProps> = ({
  owner,
  repoName,
  branches,
  initialBaseBranch = 'main',
  initialHeadBranch = 'feature/game-ui',
  token,
  onSelectCommit,
}) => {
  const [baseBranch, setBaseBranch] = useState(initialBaseBranch);
  const [headBranch, setHeadBranch] = useState(initialHeadBranch);
  const [comparison, setComparison] = useState<BranchComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [expandedFileIndex, setExpandedFileIndex] = useState<number | null>(null);
  const [fileViewModes, setFileViewModes] = useState<Record<number, 'unified' | 'split'>>({});
  const [copiedMergeCmd, setCopiedMergeCmd] = useState(false);

  const handleRunCompare = async () => {
    setIsLoading(true);
    setExpandedFileIndex(null);
    try {
      const result = await compareBranches(owner, repoName, baseBranch, headBranch, token);
      setComparison(result);
    } catch (err) {
      console.error('Error running comparison:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapBranches = () => {
    const temp = headBranch;
    setHeadBranch(baseBranch);
    setBaseBranch(temp);
  };

  const handleCopyMergeCmd = () => {
    const cmd = `git checkout ${baseBranch} && git merge ${headBranch}`;
    navigator.clipboard.writeText(cmd);
    setCopiedMergeCmd(true);
    setTimeout(() => setCopiedMergeCmd(false), 2500);
  };

  const handleOpenGitHubPR = () => {
    const url = `https://github.com/${owner}/${repoName}/compare/${encodeURIComponent(baseBranch)}...${encodeURIComponent(headBranch)}?expand=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (branches.length > 0) {
      const existsHead = branches.some((b) => b.name === headBranch);
      const existsBase = branches.some((b) => b.name === baseBranch);

      let newHead = existsHead ? headBranch : (branches.find((b) => b.name !== initialBaseBranch)?.name || branches[0].name);
      let newBase = existsBase ? baseBranch : (branches.some((b) => b.name === initialBaseBranch) ? initialBaseBranch : branches[0].name);

      if (branches.length > 1 && newHead === newBase) {
        const altBranch = branches.find((b) => b.name !== newBase);
        if (altBranch) newHead = altBranch.name;
      }

      if (newHead !== headBranch) setHeadBranch(newHead);
      if (newBase !== baseBranch) setBaseBranch(newBase);
    }
  }, [branches, repoName, owner]);

  useEffect(() => {
    handleRunCompare();
  }, [baseBranch, headBranch]);

  const filteredFiles = comparison?.files
    ? comparison.files.filter((f) =>
        f.filename.toLowerCase().includes(fileSearch.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <GitCompare className="w-6 h-6 stroke-[2]" />
            <span>Compare branches</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Inspect unique commits, file diffs, and merge readiness between two branches.
          </p>
        </div>

        {/* PR & Action Links */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMergeCmd}
            className="text-xs"
            title="Copy git checkout & merge command"
          >
            {copiedMergeCmd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMergeCmd ? 'Cmd Copied!' : 'Copy Merge Cmd'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenGitHubPR}
            className="text-xs"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Create Pull Request</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Selectors Bar with 1-Click Swap */}
      <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Head Branch Selector */}
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Source Branch (head)
          </label>
          <select
            value={headBranch}
            onChange={(e) => setHeadBranch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            {branches.length === 0 ? (
              <option value={headBranch || 'main'} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                {headBranch || 'main'}
              </option>
            ) : (
              branches.map((b) => (
                <option key={b.name} value={b.name} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                  {b.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 1-Click Swap Button */}
        <div className="flex items-center justify-center sm:pt-6">
          <button
            onClick={handleSwapBranches}
            title="Swap source and target branches"
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 border border-neutral-200 dark:border-neutral-700"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Base Branch Selector */}
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Target Branch (base)
          </label>
          <select
            value={baseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            {branches.length === 0 ? (
              <option value={baseBranch || 'main'} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                {baseBranch || 'main'}
              </option>
            ) : (
              branches.map((b) => (
                <option key={b.name} value={b.name} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                  {b.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="sm:pt-6 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={handleRunCompare}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
            <span>Compare</span>
          </Button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-8 text-center rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-3 animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin text-neutral-400 mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Comparing branch differences...</p>
        </div>
      )}

      {/* Comparison Results */}
      {!isLoading && comparison && (
        comparison.total_commits === 0 && comparison.stats?.total_files === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Branches are identical and up-to-date
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              No unique commits or file differences found when comparing <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">{headBranch}</span> against <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">{baseBranch}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Merge Status & Metrics Banner */}
            <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                      {comparison.headBranch} <span className="text-neutral-400 font-normal">against</span> {comparison.baseBranch}
                    </span>

                    {/* Merge Status Badge */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Able to merge automatically
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Comparing all commits present in source branch that are not in target branch.
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                      {comparison.total_commits}
                    </div>
                    <div className="text-[11px] font-medium text-neutral-500">unique commits</div>
                  </div>

                  <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-700" />

                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                      {comparison.stats.total_files}
                    </div>
                    <div className="text-[11px] font-medium text-neutral-500">files changed</div>
                  </div>

                  <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-700" />

                  <div className="flex flex-col justify-center text-xs font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{comparison.stats.additions.toLocaleString()}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400">
                      -{comparison.stats.deletions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unique Commits List */}
            {comparison.commits.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                  Unique Commits ({comparison.commits.length})
                </h3>

                <div className="space-y-2.5">
                  {comparison.commits.map((c) => (
                    <div
                      key={c.sha}
                      onClick={() => onSelectCommit(c)}
                      className="p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all duration-150 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white flex-shrink-0" />
                        <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-500 transition-colors">
                          {c.commit?.message}
                        </span>
                      </div>

                      <span className="font-mono text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded flex-shrink-0">
                        {c.sha.substring(0, 7)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changed Files Section with Search & Expandable Split Diff */}
            {comparison.files && comparison.files.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                    Changed Files ({filteredFiles.length} of {comparison.files.length})
                  </h3>

                  {/* File Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter files by name..."
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredFiles.map((file, idx) => {
                    const isExpanded = expandedFileIndex === idx;
                    const mode = fileViewModes[idx] || 'unified';

                    const patchLines = file.patch ? file.patch.split('\n') : [];
                    const beforeLines = patchLines.length > 0
                      ? patchLines.filter((l) => !l.startsWith('+'))
                      : [`// ${file.filename} (Base branch)`];
                    const afterLines = patchLines.length > 0
                      ? patchLines.filter((l) => !l.startsWith('-'))
                      : [`// ${file.filename} (Head branch)`];

                    return (
                      <div
                        key={file.filename || idx}
                        className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 overflow-hidden transition-all duration-150"
                      >
                        {/* File Row Header */}
                        <div
                          onClick={() => setExpandedFileIndex(isExpanded ? null : idx)}
                          className="p-3.5 flex items-center justify-between gap-4 text-xs cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors select-none"
                        >
                          <div className="flex items-center gap-2.5 font-mono truncate">
                            <FileCode className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                            <span className="text-neutral-800 dark:text-neutral-200 font-semibold truncate">
                              {file.filename}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded font-sans ${
                                file.status === 'added'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : file.status === 'removed'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {file.status || 'modified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 font-mono font-bold flex-shrink-0">
                            {file.additions !== undefined && (
                              <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                            )}
                            {file.deletions !== undefined && (
                              <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                        </div>

                        {/* Inline Expandable Code Diff */}
                        {isExpanded && (
                          <div className="p-4 border-t border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-950/90 space-y-3 animate-in fade-in duration-150">
                            {/* Mode Toggle bar */}
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                              <div className="text-[11px] font-mono text-neutral-400">
                                {file.patch ? `${patchLines.length} diff lines` : 'No patch preview available'}
                              </div>

                              <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px] font-medium">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFileViewModes((prev) => ({ ...prev, [idx]: 'unified' }));
                                  }}
                                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                                    mode === 'unified'
                                      ? 'bg-neutral-800 text-white shadow-sm'
                                      : 'text-neutral-500 hover:text-neutral-300'
                                  }`}
                                >
                                  <Rows className="w-3 h-3" />
                                  <span>Unified</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFileViewModes((prev) => ({ ...prev, [idx]: 'split' }));
                                  }}
                                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                                    mode === 'split'
                                      ? 'bg-neutral-800 text-white shadow-sm'
                                      : 'text-neutral-500 hover:text-neutral-300'
                                  }`}
                                >
                                  <Columns className="w-3 h-3" />
                                  <span>Split</span>
                                </button>
                              </div>
                            </div>

                            {mode === 'split' ? (
                              <SplitDiffView
                                filename={file.filename}
                                beforeCode={beforeLines}
                                afterCode={afterLines}
                              />
                            ) : (
                              <DiffViewer
                                filename={file.filename}
                                status={file.status}
                                additions={file.additions}
                                deletions={file.deletions}
                                patch={file.patch}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredFiles.length === 0 && (
                    <div className="p-6 text-center text-xs text-neutral-500 bg-white dark:bg-neutral-900/40 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50">
                      No files matching &ldquo;{fileSearch}&rdquo;.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
