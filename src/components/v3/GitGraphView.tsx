import React, { useState, useMemo } from 'react';
import { Branch, Commit } from '@/lib/types';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Search,
  ExternalLink,
  Eye,
  Filter,
  Terminal,
  Calendar,
  User,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { VisualDiffModal } from './VisualDiffModal';
import { ThreeGitTreeCanvas } from '../visual/ThreeGitTreeCanvas';
import { Box, Layers } from 'lucide-react';

interface GitGraphViewProps {
  branches: Branch[];
  commits: Commit[];
  owner?: string;
  repo?: string;
  token?: string | null;
}

const LANE_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f43f5e', // rose
];

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const GitGraphView: React.FC<GitGraphViewProps> = ({
  branches,
  commits,
  owner,
  repo,
  token,
}) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitForDiff, setSelectedCommitForDiff] = useState<Commit | null>(null);

  // Assign each branch to a lane index
  const branchLaneMap = useMemo(() => {
    const map = new Map<string, number>();
    branches.forEach((b, idx) => {
      map.set(b.name, idx);
    });
    return map;
  }, [branches]);

  // Filter commits
  const filteredCommits = useMemo(() => {
    return commits.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.commit?.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.commit?.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sha.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch =
        selectedBranch === 'all' ||
        c.branch === selectedBranch ||
        (!c.branch && selectedBranch === 'main');

      return matchesSearch && matchesBranch;
    });
  }, [commits, searchQuery, selectedBranch]);

  // Empty state for brand-new repositories (0 commits)
  if (commits.length === 0 && branches.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/70">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Git History Graph
            </h1>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Topological visual commit graph and branch rails.
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 mx-auto flex items-center justify-center">
            <GitMerge className="w-6 h-6" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              No Git Commits Found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              This repository is currently empty on GitHub. Push your initial commit to see your live branch graph and commit tracks.
            </p>
          </div>

          <div className="max-w-md mx-auto text-left rounded-xl bg-[#090a0c] p-4 text-xs font-mono text-neutral-300 border border-neutral-800 space-y-1.5 shadow-apple-dark">
            <div className="text-neutral-500 text-[10px] pb-1 border-b border-neutral-800">
              # Quick start command line setup
            </div>
            <div className="text-emerald-400">$ git init</div>
            <div>$ git add .</div>
            <div>$ git commit -m &quot;first commit&quot;</div>
            <div>$ git branch -M main</div>
            <div>$ git remote add origin https://github.com/{owner || 'user'}/{repo || 'repo'}.git</div>
            <div className="text-emerald-400">$ git push -u origin main</div>
          </div>
        </div>
      </div>
    );
  }

  const ROW_HEIGHT = 64;
  const LANE_WIDTH = 24;
  const LEFT_PADDING = 24;
  const maxLanes = Math.max(1, branches.length);
  const svgWidth = LEFT_PADDING + maxLanes * LANE_WIDTH + 20;
  const svgHeight = Math.max(200, filteredCommits.length * ROW_HEIGHT);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 font-sans animate-fade-in">
      {/* Title Bar & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60 dark:border-neutral-800/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Git History Graph
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              ● Live Topology
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Interactive multi-branch commit graph and topological history.
          </p>
        </div>

        {/* Search, Branch Filter & 2D/3D Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 2D vs 3D Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === '2d'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Rails</span>
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-emerald-500" />
              <span>3D Tree</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search commits, authors, SHAs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/50 w-60"
            />
          </div>

          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-neutral-800 dark:text-neutral-200 text-xs font-medium focus:outline-none pr-2 py-0.5 cursor-pointer font-mono"
              >
                <option value="all">All Branches ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 3D Spatial Tree View or 2D Graph Container */}
      {viewMode === '3d' ? (
        <div className="h-[620px] w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-[#07080a] overflow-hidden shadow-subtle relative animate-fade-in">
          <ThreeGitTreeCanvas
            branches={branches}
            commits={commits}
            onSelectCommit={(hash) => {
              const found = commits.find((c) => c.sha.startsWith(hash) || hash.startsWith(c.sha.slice(0, 7)));
              if (found) setSelectedCommitForDiff(found);
            }}
          />
        </div>
      ) : (
        /* Main Graph Container with Frosted Glass */
        <div className="rounded-2xl apple-glass-card overflow-hidden">
          {/* Branch Legend */}
        {branches.length > 0 && (
          <div className="px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center gap-2.5 overflow-x-auto text-xs bg-black/[0.02] dark:bg-white/[0.02]">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" /> Branches:
            </span>
            {branches.map((b, idx) => {
              const color = LANE_COLORS[idx % LANE_COLORS.length];
              return (
                <div
                  key={b.name}
                  onClick={() => setSelectedBranch(selectedBranch === b.name ? 'all' : b.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono text-[11px] cursor-pointer apple-interactive ${
                    selectedBranch === b.name
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm border-transparent'
                      : 'bg-black/[0.03] dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{b.name}</span>
                  {b.protected && <span className="text-[9px] text-neutral-400">(protected)</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Graph Rows */}
        <div className="relative overflow-x-auto min-w-[750px]">
          {/* SVG Rails Layer */}
          <svg
            className="absolute left-0 top-0 pointer-events-none z-0"
            width={svgWidth}
            height={svgHeight}
          >
            {/* Vertical Lane Rails */}
            {Array.from({ length: maxLanes }).map((_, laneIdx) => {
              const x = LEFT_PADDING + laneIdx * LANE_WIDTH + LANE_WIDTH / 2;
              const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
              return (
                <line
                  key={laneIdx}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={svgHeight}
                  stroke={color}
                  strokeWidth="1.5"
                  strokeOpacity="0.25"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Connecting Bezier Lines between Commits */}
            {filteredCommits.map((c, idx) => {
              if (idx === filteredCommits.length - 1) return null;
              const lane: number = (c.branch ? branchLaneMap.get(c.branch) : undefined) ?? 0;
              const nextCommit = filteredCommits[idx + 1];
              const nextLane: number = (nextCommit.branch ? branchLaneMap.get(nextCommit.branch) : undefined) ?? 0;

              const x1 = LEFT_PADDING + lane * LANE_WIDTH + LANE_WIDTH / 2;
              const y1 = idx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const x2 = LEFT_PADDING + nextLane * LANE_WIDTH + LANE_WIDTH / 2;
              const y2 = (idx + 1) * ROW_HEIGHT + ROW_HEIGHT / 2;

              const color = LANE_COLORS[lane % LANE_COLORS.length];

              if (x1 === x2) {
                return (
                  <line
                    key={`line-${c.sha}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth="2.5"
                  />
                );
              }

              // Smooth curve connecting different branches
              const cy1 = y1 + (y2 - y1) * 0.5;
              const cy2 = y1 + (y2 - y1) * 0.5;
              const path = `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`;

              return (
                <path
                  key={`curve-${c.sha}`}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>

          {/* Commit Rows List */}
          <div className="relative z-10 divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredCommits.map((commit, idx) => {
              const lane: number = (commit.branch ? branchLaneMap.get(commit.branch) : undefined) ?? 0;
              const color = LANE_COLORS[lane % LANE_COLORS.length];
              const nodeX = LEFT_PADDING + lane * LANE_WIDTH + LANE_WIDTH / 2;
              const authorName =
                commit.commit?.author?.name || commit.author?.login || 'Developer';
              const message = commit.commit?.message?.split('\n')[0] || 'Commit';

              // Check if any branch HEAD points to this commit
              const headBranches = branches.filter(
                (b) => b.commit?.sha && commit.sha.startsWith(b.commit.sha.substring(0, 7))
              );

              return (
                <div
                  key={commit.sha}
                  onClick={() => setSelectedCommitForDiff(commit)}
                  className="flex items-center gap-4 py-3.5 px-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer transition-all duration-200 active:scale-[0.99] active:duration-75 group select-none"
                  style={{ minHeight: `${ROW_HEIGHT}px` }}
                >
                  {/* Visual Node Dot Spacer */}
                  <div
                    className="relative flex items-center justify-center flex-shrink-0"
                    style={{ width: `${svgWidth}px` }}
                  >
                    <div
                      className="absolute w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm transition-transform group-hover:scale-125 flex items-center justify-center"
                      style={{
                        left: `${nodeX - 8}px`,
                        backgroundColor: color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />
                    </div>
                  </div>

                  {/* Branch Head Badges (if any branch points here) */}
                  {headBranches.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {headBranches.map((hb) => (
                        <span
                          key={hb.name}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm flex items-center gap-1"
                        >
                          <GitBranch className="w-3 h-3" />
                          {hb.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Commit Message & Author */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-900 dark:group-hover:text-white truncate">
                      {message}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span>{authorName}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(commit.commit?.author?.date)}</span>
                      {commit.stats && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            +{commit.stats.additions}
                          </span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">
                            -{commit.stats.deletions}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Commit SHA & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[11px] px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700/50">
                      {commit.sha.substring(0, 7)}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCommitForDiff(commit);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Diff</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Real Visual Diff Modal */}
      {selectedCommitForDiff && (
        <VisualDiffModal
          commit={selectedCommitForDiff}
          owner={owner}
          repo={repo}
          token={token}
          onClose={() => setSelectedCommitForDiff(null)}
        />
      )}
    </div>
  );
};
