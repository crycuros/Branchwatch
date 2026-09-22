import React from 'react';
import {
  LayoutGrid,
  FolderGit2,
  Activity,
  GitCompare,
  Workflow,
  GitMerge,
  Github,
  Compass,
  Code2,
  BookOpen,
} from 'lucide-react';
import { Repository, GitHubUser } from '@/lib/types';

export type NavTab =
  | 'overview'
  | 'graph'
  | 'visual'
  | 'community'
  | 'developer'
  | 'docs'
  | 'repositories'
  | 'activity'
  | 'compare';

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
  const mainNavItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutGrid },
    { id: 'graph' as NavTab, label: 'Git Graph', icon: GitMerge },
    { id: 'visual' as NavTab, label: 'Visual Workflow', icon: Workflow },
    { id: 'community' as NavTab, label: 'Community', icon: Compass },
    { id: 'repositories' as NavTab, label: 'Repositories', icon: FolderGit2 },
    { id: 'activity' as NavTab, label: 'Activity', icon: Activity },
    { id: 'compare' as NavTab, label: 'Compare', icon: GitCompare },
  ];

  const devNavItems = [
    { id: 'developer' as NavTab, label: 'Dev Studio', icon: Code2, badge: 'Dev' },
    { id: 'docs' as NavTab, label: 'Docs', icon: BookOpen },
  ];

  return (
    <div className="flex-1 h-full w-full min-h-0 min-w-0 bg-neutral-100/50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row font-sans transition-colors duration-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-60 h-auto md:h-full border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.06] bg-white/45 dark:bg-neutral-950/40 backdrop-blur-xl p-3 md:p-4 flex md:flex-col justify-between flex-shrink-0 overflow-y-auto z-10 no-scrollbar">
        <div className="w-full space-y-4">
          {/* Main Navigation */}
          <nav className="flex md:flex-col gap-1 w-full overflow-x-auto md:overflow-visible">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_12px_-2px_rgba(255,255,255,0.2)] font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Developer & Extensibility Hub Section */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] hidden md:block">
            <div className="px-3.5 py-1 text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
              Platform & SDK
            </div>
            <div className="mt-1 space-y-1">
              {devNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out select-none ${
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_12px_-2px_rgba(255,255,255,0.2)] font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                          isActive
                            ? 'bg-neutral-700 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Account Section */}
        <div className="hidden md:block pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1">
          <div className="px-3.5 py-1.5 text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Account
          </div>

          <button
            onClick={onConnectTokenClick}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors group select-none text-left"
          >
            <div className="flex items-center gap-2.5 truncate">
              {authUser?.avatar_url ? (
                <img
                  src={authUser.avatar_url}
                  alt={authUser.login}
                  className="w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                  <Github className="w-4 h-4" />
                </div>
              )}
              <div className="truncate text-xs">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {authUser?.name || authUser?.login || (tokenConnected ? 'Connected User' : 'Guest Account')}
                </p>
                <p className="text-[10px] text-neutral-500 truncate">
                  {tokenConnected ? `@${authUser?.login || 'token-authenticated'}` : 'Click to connect token'}
                </p>
              </div>
            </div>
          </button>

          <div className="px-3.5 pt-1.5 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
            <button
              onClick={() => onTabChange('docs')}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              Terms & Privacy
            </button>
            <span>MIT License</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full min-h-0 min-w-0 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};
