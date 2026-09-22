import React, { useState } from 'react';
import { WorkflowNode } from '@/lib/workflowTypes';
import { Commit } from '@/lib/types';
import {
  GitCommit,
  ExternalLink,
  Trash2,
  X,
  Clock,
  Play,
  GitBranch,
  Upload,
  Download,
  FileCode,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Files,
  Search,
  GitCompare,
  Shield,
  Terminal,
  Globe,
  Layers,
  ListTree,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface NodeInspectorProps {
  selectedNode: WorkflowNode | null;
  commits: Commit[];
  localFiles?: { path: string; status: string; additions?: number; deletions?: number }[];
  onDeleteNode: (id: string) => void;
  onExecuteAction: (node: WorkflowNode) => void;
  onCloseInspector?: () => void;
  onUpdateConfig?: (id: string, newConfig: Partial<WorkflowNode['config']>) => void;
  onBaseBranchChange?: (branchName: string, newBase: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  commits,
  localFiles = [],
  onDeleteNode,
  onExecuteAction,
  onCloseInspector,
  onUpdateConfig,
  onBaseBranchChange,
}) => {
  const [branchTab, setBranchTab] = useState<'commits' | 'files'>('commits');
  const [branchSearch, setBranchSearch] = useState('');

  if (!selectedNode) {
    return (
      <div className="p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/30 text-center text-xs text-neutral-400">
        Select a node on the canvas to inspect details, view branch commit history, or configure execution parameters.
      </div>
    );
  }

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const fileCount =
    selectedNode.config.selectedFiles?.length ??
    selectedNode.config.filesChangedCount ??
    0;

  return (
    <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-5 animate-fade-in text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
        <div>
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>{selectedNode.title}</span>
            <span className="font-mono text-[10px] text-neutral-400 font-normal capitalize">
              {selectedNode.type.replace('_', ' ')}
            </span>
          </div>
          {selectedNode.config.sha && (
            <div className="font-mono text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1.5">
              SHA: {selectedNode.config.sha}
              {selectedNode.config.commitUrl && (
                <a
                  href={selectedNode.config.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onCloseInspector && (
            <button
              onClick={onCloseInspector}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Config Form / Properties */}
      {onUpdateConfig && (
        <div className="space-y-4">
          {/* Staging / Working Tree Files */}
          {selectedNode.type === 'stage' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-500">
                  Files to Stage
                </label>
                <span className="font-mono text-[10px] text-neutral-400">
                  {selectedNode.config.selectedFiles?.length || 0} selected
                </span>
              </div>

              {localFiles.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1 p-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
                  {localFiles.map((file) => {
                    const isSelected =
                      selectedNode.config.selectedFiles?.includes(file.path) ?? false;
                    return (
                      <label
                        key={file.path}
                        className={`p-1.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-200/80 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const cur = selectedNode.config.selectedFiles || [];
                              const next = e.target.checked
                                ? [...cur, file.path]
                                : cur.filter((p) => p !== file.path);
                              onUpdateConfig(selectedNode.id, {
                                selectedFiles: next,
                                filesChangedCount: next.length,
                              });
                            }}
                            className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                          />
                          <span className="truncate">{file.path}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. src/app/page.tsx, README.md"
                  value={selectedNode.config.selectedFiles?.join(', ') || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const files = val
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    onUpdateConfig(selectedNode.id, {
                      selectedFiles: files.length > 0 ? files : undefined,
                      filesChangedCount: files.length > 0 ? files.length : 1,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs"
                />
              )}
            </div>
          )}

          {/* Commit Message field */}
          {selectedNode.type === 'commit' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-neutral-500">
                Commit Message
              </label>
              <textarea
                rows={2}
                placeholder="Describe your changes..."
                value={selectedNode.config.commitMessage || ''}
                onChange={(e) => onUpdateConfig(selectedNode.id, { commitMessage: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs resize-none"
              />
            </div>
          )}

          {/* BRANCH DEEP INSPECTION */}
          {selectedNode.type === 'branch' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={selectedNode.config.branchName || ''}
                    onChange={(e) => onUpdateConfig(selectedNode.id, { branchName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Compare vs Base
                  </label>
                  <select
                    value={selectedNode.config.baseBranchName || 'main'}
                    onChange={(e) => {
                      const newBase = e.target.value;
                      onUpdateConfig(selectedNode.id, { baseBranchName: newBase });
                      onBaseBranchChange?.(selectedNode.config.branchName || 'main', newBase);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono text-xs"
                  >
                    {(selectedNode.config.availableBranches || ['main', 'master']).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ahead / Behind Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                  <div className="text-[10px] text-neutral-400 font-medium">Ahead</div>
                  <div className="text-sm font-bold font-mono text-emerald-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    {selectedNode.config.aheadBy ?? 0}
                  </div>
                  <div className="text-[9px] text-neutral-500">commits ahead</div>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                  <div className="text-[10px] text-neutral-400 font-medium">Behind</div>
                  <div className="text-sm font-bold font-mono text-rose-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    {selectedNode.config.behindBy ?? 0}
                  </div>
                  <div className="text-[9px] text-neutral-500">commits behind</div>
                </div>
              </div>

              {/* Subtabs: Commits Stack vs Committed Files */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBranchTab('commits')}
                      className={`font-semibold text-[11px] pb-0.5 transition-colors flex items-center gap-1 ${
                        branchTab === 'commits'
                          ? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <GitCommit className="w-3 h-3" />
                      <span>Commits Stack ({selectedNode.config.branchCommits?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setBranchTab('files')}
                      className={`font-semibold text-[11px] pb-0.5 transition-colors flex items-center gap-1 ${
                        branchTab === 'files'
                          ? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Files className="w-3 h-3" />
                      <span>Files ({selectedNode.config.branchFiles?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* Commits Stack List */}
                {branchTab === 'commits' && (
                  <div className="max-h-52 overflow-y-auto space-y-1.5 p-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    {selectedNode.config.branchCommits && selectedNode.config.branchCommits.length > 0 ? (
                      selectedNode.config.branchCommits.map((c) => (
                        <div
                          key={c.sha}
                          className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-zinc-300 font-semibold px-1 rounded bg-zinc-800">
                              {c.sha}
                            </span>
                            <span className="text-neutral-400">{formatRelativeTime(c.date)}</span>
                          </div>
                          <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2">
                            {c.message}
                          </p>
                          <div className="text-[10px] text-neutral-400">by {c.author}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-[10px] text-neutral-500">
                        No unique commits detected on this branch vs {selectedNode.config.baseBranchName || 'main'}.
                      </div>
                    )}
                  </div>
                )}

                {/* Committed Files List */}
                {branchTab === 'files' && (
                  <div className="space-y-1.5">
                    {selectedNode.config.branchFiles && selectedNode.config.branchFiles.length > 5 && (
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2.5 top-2 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={branchSearch}
                          onChange={(e) => setBranchSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono"
                        />
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1 p-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      {selectedNode.config.branchFiles && selectedNode.config.branchFiles.length > 0 ? (
                        selectedNode.config.branchFiles
                          .filter((f) => !branchSearch || f.path.toLowerCase().includes(branchSearch.toLowerCase()))
                          .map((f) => (
                            <div
                              key={f.path}
                              className="p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex items-center justify-between gap-2 text-[11px] font-mono"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                                    f.status === 'added'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : f.status === 'deleted'
                                      ? 'bg-rose-500/10 text-rose-500'
                                      : 'bg-neutral-500/10 text-neutral-400'
                                  }`}
                                >
                                  {f.status.substring(0, 3)}
                                </span>
                                <span className="truncate text-neutral-800 dark:text-neutral-200" title={f.path}>
                                  {f.path}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                {f.additions > 0 && <span className="text-emerald-500">+{f.additions}</span>}
                                {f.deletions > 0 && <span className="text-rose-500">-{f.deletions}</span>}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-4 text-[10px] text-neutral-500">
                          No file diffs on this branch.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOM SCRIPT & WEBHOOK NODE INSPECTOR */}
          {selectedNode.type === 'plugin' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase font-semibold">
                    {selectedNode.config.runtime || 'shell'}
                  </span>
                  <span className="text-neutral-400 text-[10px]">
                    {selectedNode.config.pluginSource || 'Custom Node'}
                  </span>
                </div>
              </div>

              {/* Permissions info */}
              {selectedNode.config.permissions && (
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-400" />
                    Declared Permissions
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    {selectedNode.config.permissions.shell && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        shell: true
                      </span>
                    )}
                    {selectedNode.config.permissions.network && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        network: true
                      </span>
                    )}
                    {selectedNode.config.permissions.git && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        git: true
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      fs: {selectedNode.config.permissions.filesystem || 'workspace'}
                    </span>
                  </div>
                </div>
              )}

              {/* Command / Webhook display */}
              {selectedNode.config.runtime === 'webhook' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-500">Webhook URL</label>
                  <code className="block p-2 rounded-lg bg-zinc-950 font-mono text-[11px] text-blue-300 truncate">
                    {selectedNode.config.webhookConfig?.method || 'POST'} {selectedNode.config.webhookConfig?.url || 'No URL'}
                  </code>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-500">Script / Command</label>
                  <pre className="p-2 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedNode.config.scriptContent || selectedNode.config.commandTemplate || 'No script'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full flex items-center justify-center gap-1.5 shadow-sm"
          onClick={() => onExecuteAction(selectedNode)}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute {selectedNode.title}</span>
        </Button>
      </div>
    </div>
  );
};
