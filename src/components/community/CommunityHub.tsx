import React, { useState, useEffect, useMemo } from 'react';
import { CommunityWorkflow, WorkflowCategory } from '@/lib/communityTypes';
import {
  getCommunityWorkflows,
  getStarredWorkflowIds,
  toggleStarWorkflow,
} from '@/lib/communityStorage';
import { WorkflowCard } from './WorkflowCard';
import {
  Search,
  Plus,
  Compass,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface CommunityHubProps {
  onOpenWorkflowInCanvas: (workflow: CommunityWorkflow) => void;
  onForkWorkflowToCanvas: (workflow: CommunityWorkflow) => void;
  onOpenPublishModal: () => void;
  onOpenDiscussions: (workflow: CommunityWorkflow) => void;
}

const CATEGORIES: { id: WorkflowCategory; label: string }[] = [
  { id: 'all', label: 'All Workflows' },
  { id: 'basics', label: 'Git Basics' },
  { id: 'feature', label: 'Feature Development' },
  { id: 'hotfix', label: 'Hotfix & Patch' },
  { id: 'opensource', label: 'Open Source' },
  { id: 'release', label: 'Release' },
  { id: 'monorepo', label: 'Monorepo' },
];

type SortOption = 'stars' | 'forks' | 'used' | 'newest';

export const CommunityHub: React.FC<CommunityHubProps> = ({
  onOpenWorkflowInCanvas,
  onForkWorkflowToCanvas,
  onOpenPublishModal,
  onOpenDiscussions,
}) => {
  const [workflows, setWorkflows] = useState<CommunityWorkflow[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('stars');

  // Load workflows & stars on mount
  useEffect(() => {
    setWorkflows(getCommunityWorkflows());
    setStarredIds(getStarredWorkflowIds());
  }, []);

  const handleStarToggle = (workflowId: string) => {
    const isNowStarred = toggleStarWorkflow(workflowId);
    setStarredIds((prev) =>
      isNowStarred ? [...prev, workflowId] : prev.filter((id) => id !== workflowId)
    );
    setWorkflows(getCommunityWorkflows());
  };

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    let result = workflows.filter((w) => w.visibility === 'public');

    if (selectedCategory !== 'all') {
      result = result.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)) ||
          w.author.name.toLowerCase().includes(q) ||
          w.author.login.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'stars') return b.starsCount - a.starsCount;
      if (sortBy === 'forks') return b.forksCount - a.forksCount;
      if (sortBy === 'used') return b.usageCount - a.usageCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [workflows, selectedCategory, searchQuery, sortBy]);

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
              Community Workflow Hub
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            Discover, fork, and reuse proven Git workflows crafted by software engineers and teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onOpenPublishModal}>
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Workflow</span>
          </Button>
        </div>
      </div>

      {/* Featured Section (if any and not searching) */}
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
                workflow={fw}
                isStarred={starredIds.includes(fw.id)}
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
          {/* Search Input */}
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

          {/* Sort Selector */}
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
          <span>
            {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isStarred={starredIds.includes(workflow.id)}
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
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No workflows found
            </h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No community workflows match the selected category or search filter. Try adjusting your search query or be the first to publish one!
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
