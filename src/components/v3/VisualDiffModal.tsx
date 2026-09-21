import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Commit } from '@/lib/types';
import { fetchCommitDetail } from '@/lib/github';
import { X, FileCode, Plus, Minus, GitCommit, ExternalLink, Columns, Rows, Loader2 } from 'lucide-react';
import { SplitDiffView } from './SplitDiffView';
import { DiffViewer } from './DiffViewer';

interface VisualDiffModalProps {
  commit: Commit | null;
  owner?: string;
  repo?: string;
  token?: string | null;
  onClose: () => void;
}

export const VisualDiffModal: React.FC<VisualDiffModalProps> = ({
  commit,
  owner,
  repo,
  token,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [detailedCommit, setDetailedCommit] = useState<Commit | null>(commit);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDetailedCommit(commit);
    if (!commit) return;

    // If commit doesn't have detailed files array and we have repo info, fetch it from GitHub
    if ((!commit.files || commit.files.length === 0) && owner && repo) {
      setIsLoading(true);
      fetchCommitDetail(owner, repo, commit.sha, token)
        .then((detail) => {
          if (detail) setDetailedCommit(detail);
        })
        .finally(() => setIsLoading(false));
    }
  }, [commit, owner, repo, token]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!commit || !mounted) return null;

  const currentCommit = detailedCommit || commit;
  const authorName = currentCommit.commit?.author?.name || currentCommit.author?.login || 'Developer';
  const additions = currentCommit.stats?.additions ?? 0;
  const deletions = currentCommit.stats?.deletions ?? 0;
  const files = currentCommit.files || [];

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/50 dark:bg-black/75 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="apple-glass-modal rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-apple-modal font-sans my-auto relative"
      >
        {/* Header */}
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between flex-shrink-0 bg-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-neutral-800 dark:text-neutral-200 flex-shrink-0 border border-black/[0.06] dark:border-white/[0.08]">
              <GitCommit className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Commit Diff</span>
                {currentCommit.html_url && (
                  <a
                    href={currentCommit.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5 truncate">
                <span>{currentCommit.sha.substring(0, 7)}</span>
                <span>·</span>
                <span>{authorName}</span>
                {currentCommit.commit?.author?.date && (
                  <>
                    <span>·</span>
                    <span>{new Date(currentCommit.commit.author.date).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* View mode toggle */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl text-xs font-medium border border-neutral-200/50 dark:border-neutral-700/50">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'unified'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-subtle'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
                <span>Unified</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-subtle'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Commit Message & Stats Bar */}
        <div className="p-4 bg-neutral-50/60 dark:bg-neutral-800/30 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between flex-shrink-0">
          <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-xl">
            {currentCommit.commit?.message}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold flex-shrink-0">
            <span className="text-neutral-500 font-normal">{files.length} files changed</span>
            <span className="text-[#7ee787] flex items-center gap-0.5">
              <Plus className="w-3.5 h-3.5" />
              {additions}
            </span>
            <span className="text-[#ff7b72] flex items-center gap-0.5">
              <Minus className="w-3.5 h-3.5" />
              {deletions}
            </span>
          </div>
        </div>

        {/* Diff Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading live commit diff...</span>
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-100/60 dark:bg-neutral-800/40 flex items-center justify-between">
                    <div className="w-44 h-4 rounded bg-neutral-200/50 dark:bg-neutral-700/50 animate-pulse" />
                    <div className="w-16 h-3 rounded bg-neutral-200/40 dark:bg-neutral-700/40 animate-pulse" />
                  </div>
                  <div className="p-4 space-y-2 bg-neutral-50/30 dark:bg-neutral-900/30">
                    <div className="w-3/4 h-3.5 rounded bg-neutral-200/30 dark:bg-neutral-800/30 animate-pulse" />
                    <div className="w-1/2 h-3.5 rounded bg-neutral-200/30 dark:bg-neutral-800/30 animate-pulse" />
                    <div className="w-2/3 h-3.5 rounded bg-neutral-200/30 dark:bg-neutral-800/30 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && files.length === 0 && (
            <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
              <FileCode className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
              <span>No modified files recorded for this commit.</span>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-6 animate-fade-in">
              {files.map((file) => {
                const patchLines = file.patch ? file.patch.split('\n') : [];
                const beforeLines = patchLines.filter((l) => !l.startsWith('+'));
                const afterLines = patchLines.filter((l) => !l.startsWith('-'));

                return (
                  <div key={file.filename} className="space-y-2">
                    {viewMode === 'split' && file.patch ? (
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
