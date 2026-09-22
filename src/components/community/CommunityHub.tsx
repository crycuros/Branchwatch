import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CommunityWorkflow, WorkflowCategory } from '@/lib/communityTypes';
import { getCommunityWorkflows, toggleStarWorkflow } from '@/lib/communityStorage';
import { WorkflowCard } from './WorkflowCard';
import { PluginMarketplace } from '../plugins/PluginMarketplace';
import {
  Search,
  Plus,
  Compass,
  Sparkles,
  SlidersHorizontal,
  Star,
  Loader2,
  Box,
  Layers,
  Code2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { checkUserStarredRepo, starRepositoryOnGitHub, unstarRepositoryOnGitHub } from '@/lib/github';

interface CommunityHubProps {
  token?: string | null;
  onOpenWorkflowInCanvas: (workflow: CommunityWorkflow) => void;
  onForkWorkflowToCanvas: (workflow: CommunityWorkflow) => void;
  onOpenPublishModal: () => void;
  onOpenDiscussions: (workflow: CommunityWorkflow) => void;
  onOpenDevStudio?: () => void;
}

const CATEGORIES: { id: WorkflowCategory; label: string }[] = [
  { id: 'all', label: 'All Workflows' },
  { id: 'enterprise', label: 'Big Tech & Enterprise' },
  { id: 'startup', label: 'Startup & Agile Teams' },
  { id: 'casual', label: 'Casual & Solo Devs' },
  { id: 'opensource', label: 'Open Source' },
  { id: 'hotfix', label: 'Emergency Hotfix' },
  { id: 'monorepo', label: 'Monorepo' },
  { id: 'basics', label: 'Git Basics' },
];

type SortOption = 'stars' | 'forks' | 'used' | 'newest';

// Per-workflow starred state tracked locally after initial load
type StarMap = Record<string, { starred: boolean; count: number }>;

export const CommunityHub: React.FC<CommunityHubProps> = ({
  token,
  onOpenWorkflowInCanvas,
  onForkWorkflowToCanvas,
  onOpenPublishModal,
  onOpenDiscussions,
  onOpenDevStudio,
}) => {
  const [hubView, setHubView] = useState<'workflows' | 'plugins'>('workflows');
  const [workflows, setWorkflows] = useState<CommunityWorkflow[]>([]);
  const [starMap, setStarMap] = useState<StarMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('stars');

  // GitHub Repo Star State (crycuros/Branchwatch)
  const [isGitHubStarred, setIsGitHubStarred] = useState(false);
  const [isStarringGitHub, setIsStarringGitHub] = useState(false);
  const [githubStarCount, setGithubStarCount] = useState<number | null>(null);

  // ─── Load workflows from DB ─────────────────────────────────────────────────
  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCommunityWorkflows({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
      });
      setWorkflows(data);

      // Initialize star map from fetched data
      const map: StarMap = {};
      data.forEach((w) => {
        map[w.id] = { starred: false, count: w.starsCount };
      });
      setStarMap(map);
    } catch (err) {
      console.error('Failed to load community workflows:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // ─── GitHub Repo Star (crycuros/Branchwatch) ────────────────────────────────
  useEffect(() => {
    fetch('https://api.github.com/repos/crycuros/Branchwatch')
      .then((r) => r.json())
      .then((d) => { if (typeof d.stargazers_count === 'number') setGithubStarCount(d.stargazers_count); })
      .catch(() => {});

    if (token) {
      checkUserStarredRepo('crycuros', 'Branchwatch', token).then(setIsGitHubStarred);
    }
  }, [token]);

  const handleGitHubStarToggle = async () => {
    if (!token) {
      window.open('https://github.com/crycuros/Branchwatch', '_blank', 'noopener,noreferrer');
      return;
    }
    setIsStarringGitHub(true);
    try {
      if (isGitHubStarred) {
        const ok = await unstarRepositoryOnGitHub('crycuros', 'Branchwatch', token);
        if (ok) { setIsGitHubStarred(false); setGithubStarCount((c) => (c !== null ? Math.max(0, c - 1) : null)); }
      } else {
        const ok = await starRepositoryOnGitHub('crycuros', 'Branchwatch', token);
        if (ok) { setIsGitHubStarred(true); setGithubStarCount((c) => (c !== null ? c + 1 : 1)); }
      }
    } finally {
      setIsStarringGitHub(false);
    }
  };

  // ─── Community Workflow Star toggle ─────────────────────────────────────────
  const handleStarToggle = async (workflowId: string) => {
    try {
      const result = await toggleStarWorkflow(workflowId);
      setStarMap((prev) => ({
        ...prev,
        [workflowId]: { starred: result.starred, count: result.starsCount },
      }));
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const featuredWorkflows = useMemo(
    () => workflows.filter((w) => w.isFeatured && w.visibility === 'public'),
    [workflows]
  );

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Community Hub & Plugins
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            Discover, fork, and reuse Git workflows and install custom community nodes for your visual canvas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Hub View Switcher */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setHubView('workflows')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                hubView === 'workflows'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Workflows</span>
            </button>
            <button
              onClick={() => setHubView('plugins')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                hubView === 'plugins'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Plugins & Nodes</span>
            </button>
          </div>

          {/* Star BranchWatch on GitHub */}
          <button
            onClick={handleGitHubStarToggle}
            disabled={isStarringGitHub}
            title={!token ? 'Open repository on GitHub to star' : isGitHubStarred ? 'Unstar BranchWatch on GitHub' : 'Star BranchWatch directly on GitHub'}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 apple-press ${
              isGitHubStarred
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm'
                : 'bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-800'
            } disabled:opacity-50`}
          >
            {isStarringGitHub ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Star className={`w-3.5 h-3.5 ${isGitHubStarred ? 'fill-current' : 'text-neutral-500'}`} />
            )}
            <span>{isGitHubStarred ? 'Starred' : 'Star'}</span>
            {githubStarCount !== null && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono ${isGitHubStarred ? 'bg-white/20 dark:bg-black/10' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
                {githubStarCount}
              </span>
            )}
          </button>

          {onOpenDevStudio && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDevStudio}
              className="text-xs font-semibold"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Dev Studio</span>
            </Button>
          )}

          {hubView === 'workflows' && (
            <Button variant="primary" size="sm" onClick={onOpenPublishModal}>
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Workflow</span>
            </Button>
          )}
        </div>
      </div>

      {/* Conditionally Render Plugins Marketplace */}
      {hubView === 'plugins' ? (
        <PluginMarketplace onOpenDevStudio={onOpenDevStudio} />
      ) : (
        <>
          {/* Featured Section */}
          {!searchQuery && selectedCategory === 'all' && featuredWorkflows.length > 0 && (
            <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Featured Workflow Recipes</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredWorkflows.slice(0, 2).map((fw) => (
              <WorkflowCard
                key={fw.id}
                workflow={{ ...fw, starsCount: starMap[fw.id]?.count ?? fw.starsCount }}
                isStarred={starMap[fw.id]?.starred ?? false}
                onStarToggle={handleStarToggle}
                onOpenWorkflow={onOpenWorkflowInCanvas}
                onForkWorkflow={onForkWorkflowToCanvas}
                onOpenComments={onOpenDiscussions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 select-none" />
            <input
              type="text"
              placeholder="Search workflows by title, tags, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort workflows by"
              className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              <option value="stars">Most Starred</option>
              <option value="forks">Most Forked</option>
              <option value="used">Most Used</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all select-none apple-press ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/50 dark:border-neutral-700/50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workflow Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading workflows...
            </span>
          ) : (
            <span>{workflows.length} workflow{workflows.length !== 1 ? 's' : ''} found</span>
          )}
        </div>

        {isLoading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 animate-pulse" />
            ))}
          </div>
        ) : workflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={{ ...workflow, starsCount: starMap[workflow.id]?.count ?? workflow.starsCount }}
                isStarred={starMap[workflow.id]?.starred ?? false}
                onStarToggle={handleStarToggle}
                onOpenWorkflow={onOpenWorkflowInCanvas}
                onForkWorkflow={onForkWorkflowToCanvas}
                onOpenComments={onOpenDiscussions}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/20 space-y-3">
            <Compass className="w-8 h-8 text-neutral-400 mx-auto opacity-50" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No workflows found</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No community workflows match the selected category or search filter. Try adjusting your search or be the first to publish one!
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};
