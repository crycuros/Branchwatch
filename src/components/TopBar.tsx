import React from 'react';
import { GitBranch, Search, Sun, Moon, Github, RefreshCw, ChevronDown } from 'lucide-react';
import { Repository } from '@/lib/types';
import { BranchWatchLogo } from './ui/BranchWatchLogo';

interface TopBarProps {
  currentRepo: Repository | null;
  onOpenRepoSelector: () => void;
  onOpenSearch: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isUpdating: boolean;
  onRefresh: () => void;
  tokenConnected: boolean;
  onConnectTokenClick: () => void;
  onReturnHome: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRepo,
  onOpenRepoSelector,
  onOpenSearch,
  isDarkMode,
  onToggleDarkMode,
  isUpdating,
  onRefresh,
  tokenConnected,
  onConnectTokenClick,
  onReturnHome,
}) => {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform || ''));
    }
  }, []);

  return (
    <header className="h-14 apple-glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 select-none transition-colors duration-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Left section: App Brand & Repo selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-2 group text-neutral-900 dark:text-neutral-100 apple-press"
        >
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-sm transition-transform duration-200 group-hover:scale-105">
            <BranchWatchLogo className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <span className="font-semibold text-sm tracking-tight hidden sm:inline">BranchWatch</span>
        </button>

        <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">/</span>

        {currentRepo && (
          <button
            onClick={onOpenRepoSelector}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 apple-press"
          >
            <span className="text-neutral-500 font-normal">{currentRepo.owner.login} /</span>
            <span className="font-semibold">{currentRepo.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
          </button>
        )}
      </div>

      {/* Center section: Command Search trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full h-8 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 apple-press"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search branches, commits, hashes...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.1] text-[10px] font-mono text-neutral-600 dark:text-neutral-300 border border-black/[0.04] dark:border-white/[0.08]">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
      </div>

      {/* Right section: Refresh status, connection badge, dark mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 md:hidden apple-press"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onRefresh}
          disabled={isUpdating}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 disabled:opacity-50 apple-press"
          title="Refresh repository data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
          <span className="hidden sm:inline">{isUpdating ? 'Updating...' : 'Refresh'}</span>
        </button>

        <button
          onClick={onConnectTokenClick}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-all duration-150 apple-press"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tokenConnected ? 'Account Connected' : 'Connect GitHub'}</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 apple-press"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
