import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Commit } from '@/lib/types';
import { X, ExternalLink, FileCode, Plus, Minus, GitCommit, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface CommitDetailDrawerProps {
  commit: Commit | null;
  onClose: () => void;
}

export const CommitDetailDrawer: React.FC<CommitDetailDrawerProps> = ({ commit, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!commit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commit, onClose]);

  if (!mounted || !commit) return null;

  const authorName = commit.commit?.author?.name || commit.author?.login || 'Developer';
  const avatar = commit.author?.avatar_url;
  const dateStr = commit.commit?.author?.date;

  const additions = commit.stats?.additions ?? commit.files?.reduce((acc, f) => acc + f.additions, 0) ?? 0;
  const deletions = commit.stats?.deletions ?? commit.files?.reduce((acc, f) => acc + f.deletions, 0) ?? 0;
  const filesCount = commit.files?.length ?? 0;

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
        className="apple-glass-modal border-l border-black/[0.08] dark:border-white/[0.08] w-full max-w-lg h-full p-6 flex flex-col justify-between overflow-y-auto animate-apple-sheet"
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
            <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              Changed Files
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {commit.files && commit.files.length > 0 ? (
                commit.files.map((file) => (
                  <div
                    key={file.filename}
                    className="p-3 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-800/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate text-neutral-800 dark:text-neutral-200">{file.filename}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 font-medium text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                      <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                    </div>
                  </div>
                ))
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
            <Button variant="primary" size="md" className="w-full">
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
