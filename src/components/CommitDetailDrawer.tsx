import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Commit } from '@/lib/types';
import { X, ExternalLink, FileCode, Plus, Minus, GitCommit, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

import { fetchCommitDetail } from '@/lib/github';

interface CommitDetailDrawerProps {
  commit: Commit | null;
  owner?: string;
  repo?: string;
  token?: string | null;
  onClose: () => void;
}

export const CommitDetailDrawer: React.FC<CommitDetailDrawerProps> = ({
  commit,
  owner,
  repo,
  token,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [detailedCommit, setDetailedCommit] = useState<Commit | null>(commit);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDetailedCommit(commit);
    setExpandedFiles(new Set());
    if (!commit) return;

    // If commit already has files populated, skip
    if (commit.files && commit.files.length > 0) return;

    // Fetch full commit details from GitHub if owner and repo are available
    if (owner && repo && commit.sha) {
      setIsLoadingDetails(true);
      fetchCommitDetail(owner, repo, commit.sha, token)
        .then((data) => {
          if (data) {
            setDetailedCommit(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [commit, owner, repo, token]);

  useEffect(() => {
    if (!commit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commit, onClose]);

  if (!mounted || !commit) return null;

  const currentData = detailedCommit || commit;
  const authorName = currentData.commit?.author?.name || currentData.author?.login || 'Developer';
  const avatar = currentData.author?.avatar_url;
  const dateStr = currentData.commit?.author?.date;

  const additions = currentData.stats?.additions ?? currentData.files?.reduce((acc, f) => acc + f.additions, 0) ?? 0;
  const deletions = currentData.stats?.deletions ?? currentData.files?.reduce((acc, f) => acc + f.deletions, 0) ?? 0;
  const filesCount = currentData.files?.length ?? 0;

  const toggleFile = (filename: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!currentData.files) return;
    if (expandedFiles.size === currentData.files.length) {
      setExpandedFiles(new Set());
    } else {
      setExpandedFiles(new Set(currentData.files.map((f) => f.filename)));
    }
  };

  const formatRelativeTime = (date?: string) => {
    if (!date) return 'Recently';
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(date).toLocaleDateString();
  };

  const drawerContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/45 dark:bg-black/70 backdrop-blur-xl flex justify-end"
      onClick={onClose}
    >
      <div
        className="apple-glass-modal border-l border-black/[0.08] dark:border-white/[0.08] w-full max-w-xl h-full p-6 flex flex-col justify-between overflow-y-auto animate-apple-sheet font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                <GitCommit className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs text-neutral-500">commit {commit.sha.substring(0, 7)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Commit Summary Header */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug">
              {commit.commit?.message}
            </h2>

            <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
              {avatar && (
                // eslint-disable-next-html-element-content
                <img src={avatar} alt={authorName} className="w-5 h-5 rounded-full object-cover" />
              )}
              <span className="font-semibold text-neutral-900 dark:text-neutral-200">{authorName}</span>
              <span>·</span>
              <span>{formatRelativeTime(dateStr)}</span>
            </div>
          </div>

          {/* Stat metrics */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-neutral-500 font-medium">Files changed</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">{filesCount}</div>
            </div>

            <div className="flex items-center gap-3 font-mono text-sm font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <Plus className="w-3.5 h-3.5" />
                {additions}
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" />
                {deletions}
              </span>
            </div>
          </div>

          {/* Changed Files Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                Changed Files ({filesCount})
              </h3>
              {currentData.files && currentData.files.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-[11px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  {expandedFiles.size === currentData.files.length ? 'Collapse all diffs' : 'Expand all diffs'}
                </button>
              )}
            </div>

            <div className="space-y-2 font-mono text-xs">
              {isLoadingDetails ? (
                <div className="p-4 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-800/20 text-neutral-500 text-xs flex items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                  <span>Loading commit file diff details...</span>
                </div>
              ) : currentData.files && currentData.files.length > 0 ? (
                currentData.files.map((file) => {
                  const isExpanded = expandedFiles.has(file.filename);
                  return (
                    <div
                      key={file.filename}
                      className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-900/60 overflow-hidden transition-all duration-150"
                    >
                      {/* Clickable File Header */}
                      <div
                        onClick={() => toggleFile(file.filename)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors select-none"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          )}
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 ${
                              file.status === 'added'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : file.status === 'removed'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : file.status === 'renamed'
                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            }`}
                            title={`Status: ${file.status || 'modified'}`}
                          >
                            {file.status === 'added' ? 'A' : file.status === 'removed' ? 'D' : file.status === 'renamed' ? 'R' : 'M'}
                          </span>
                          <span className="truncate font-semibold text-neutral-900 dark:text-neutral-200">{file.filename}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 font-medium text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                          <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                        </div>
                      </div>

                      {/* Expandable Diff Patch Viewer */}
                      {isExpanded && (
                        <div className="border-t border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-950 p-3 overflow-x-auto text-[11px] font-mono leading-relaxed">
                          {file.patch ? (
                            <pre className="space-y-0.5">
                              {file.patch.split('\n').map((line, lIdx) => {
                                const isHunk = line.startsWith('@@');
                                const isAddition = line.startsWith('+') && !isHunk;
                                const isDeletion = line.startsWith('-') && !isHunk;

                                return (
                                  <div
                                    key={lIdx}
                                    className={`px-2 py-0.5 rounded-sm whitespace-pre ${
                                      isHunk
                                        ? 'text-neutral-400 bg-neutral-900 font-bold my-1'
                                        : isAddition
                                        ? 'bg-emerald-950/50 text-emerald-300 font-medium'
                                        : isDeletion
                                        ? 'bg-rose-950/50 text-rose-300 font-medium'
                                        : 'text-neutral-400'
                                    }`}
                                  >
                                    {line}
                                  </div>
                                );
                              })}
                            </pre>
                          ) : (
                            <div className="p-3 text-neutral-500 text-xs italic">
                              Binary file or large diff not rendered inline.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-800/20 text-neutral-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-neutral-400" />
                  <span>No individual file breakdown provided for this commit.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-6 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <a
            href={commit.html_url || `https://github.com/search?q=${commit.sha}`}
            target="_blank"
            rel="noreferrer"
            className="w-full block"
          >
            <Button variant="primary" size="md" className="w-full font-semibold">
              <ExternalLink className="w-4 h-4" />
              <span>View commit on GitHub</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
