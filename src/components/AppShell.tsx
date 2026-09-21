import React from 'react';
import { LayoutGrid, FolderGit2, Activity, GitCompare, Workflow, GitMerge, Github, Compass } from 'lucide-react';
import { Repository, GitHubUser } from '@/lib/types';

export type NavTab = 'overview' | 'graph' | 'visual' | 'community' | 'repositories' | 'activity' | 'compare';

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRepo: Repository | null;
  children: React.ReactNode;
  tokenConnected: boolean;
  onConnectTokenClick: () => void;
  authUser?: GitHubUser | null;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  currentRepo,
  children,
  tokenConnected,
  onConnectTokenClick,
  authUser,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutGrid },
    { id: 'graph' as NavTab, label: 'Git Graph', icon: GitMerge },
    { id: 'visual' as NavTab, label: 'Visual Workflow', icon: Workflow },
    { id: 'community' as NavTab, label: 'Community', icon: Compass },
    { id: 'repositories' as NavTab, label: 'Repositories', icon: FolderGit2 },
    { id: 'activity' as NavTab, label: 'Activity', icon: Activity },
    { id: 'compare' as NavTab, label: 'Compare', icon: GitCompare },
  ];

  return (
    <div className="flex-1 h-full w-full min-h-0 min-w-0 bg-neutral-100/50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row font-sans transition-colors duration-200 overflow-hidden">
      {/* Sidebar Navigation with Frosted Glass */}
      <aside className="w-full md:w-60 h-auto md:h-full border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.06] bg-white/45 dark:bg-neutral-950/40 backdrop-blur-xl p-3 md:p-4 flex md:flex-col justify-between flex-shrink-0 overflow-y-auto z-10">
        <div className="w-full">
          {/* Active Navigation List */}
          <nav className="flex md:flex-col gap-1 w-full overflow-x-auto md:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap select-none apple-press ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_12px_-2px_rgba(255,255,255,0.2)] font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Account Section */}
        <div className="hidden md:block pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1">
          <div className="px-3.5 py-1.5 text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Account
          </div>

          <button
            onClick={onConnectTokenClick}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-150 apple-press"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {authUser?.avatar_url ? (
                <img
                  src={authUser.avatar_url}
                  alt={authUser.login}
                  className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Github className="w-3.5 h-3.5 text-neutral-500" />
                </div>
              )}
              <span className="truncate font-medium">
                {authUser?.name || (authUser?.login ? `@${authUser.login}` : 'GitHub User')}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace with smooth inertia scroll */}
      <main
        className={`flex-1 w-full min-h-0 min-w-0 flex flex-col ${
          activeTab === 'visual'
            ? 'p-2 sm:p-4 overflow-y-auto no-scrollbar h-full'
            : 'max-w-6xl mx-auto p-4 sm:p-8 overflow-y-auto no-scrollbar'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="animate-fade-in w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};
