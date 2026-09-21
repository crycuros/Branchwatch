import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Branch, Commit } from '@/lib/types';
import { Search, X, GitBranch, GitCommit, User } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  commits: Commit[];
  onSelectBranch: (branch: Branch) => void;
  onSelectCommit: (commit: Commit) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  branches,
  commits,
  onSelectBranch,
  onSelectCommit,
}) => {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const filteredBranches = query.trim()
    ? branches.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredCommits = query.trim()
    ? commits.filter(
        (c) =>
          c.commit?.message.toLowerCase().includes(query.toLowerCase()) ||
          c.sha.toLowerCase().includes(query.toLowerCase()) ||
          (c.commit?.author?.name && c.commit.author.name.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/50 dark:bg-black/75 backdrop-blur-xl flex items-start justify-center pt-24 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="apple-glass-modal rounded-2xl max-w-xl w-full overflow-hidden animate-apple-modal font-sans"
      >
        {/* Input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] gap-3">
          <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search branches, commits, hashes, authors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {!query.trim() && (
            <div className="text-center py-8 text-xs text-neutral-400">
              Type a branch name, commit message, or author to search.
            </div>
          )}

          {query.trim() && filteredBranches.length === 0 && filteredCommits.length === 0 && (
            <div className="text-center py-8 text-xs text-neutral-400">
              No results found matching &ldquo;{query}&rdquo;.
            </div>
          )}

          {/* Branch Results */}
          {filteredBranches.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                Branches
              </div>
              {filteredBranches.map((b) => (
                <div
                  key={b.name}
                  onClick={() => {
                    onSelectBranch(b);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-sm text-neutral-900 dark:text-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                    <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{b.name}</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-sans font-mono">{b.commitCount} commits</span>
                </div>
              ))}
            </div>
          )}

          {/* Commit Results */}
          {filteredCommits.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                Commits
              </div>
              {filteredCommits.map((c) => (
                <div
                  key={c.sha}
                  onClick={() => {
                    onSelectCommit(c);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-sm transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <GitCommit className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate text-neutral-900 dark:text-neutral-100 text-xs font-medium">
                      {c.commit?.message}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded ml-2">
                    {c.sha.substring(0, 7)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
