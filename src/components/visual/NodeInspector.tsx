import React, { useState } from 'react';
import { WorkflowNode } from '@/lib/workflowTypes';
import { Commit } from '@/lib/types';
import {
  GitCommit, ExternalLink, Trash2, X, Clock, Play, GitBranch, Upload,
  Download, FileCode, CheckCircle2, ArrowUp, ArrowDown, Files, Search,
  GitCompare, Shield,
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
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  commits,
  localFiles = [],
  onDeleteNode,
  onExecuteAction,
  onCloseInspector,
  onUpdateConfig,
}) => {
  const [branchFileSearch, setBranchFileSearch] = useState('');

  if (!selectedNode) {
    return (
      <div className="p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/30 text-center text-xs text-neutral-400">
        Select a node on the canvas to inspect details, edit parameters, and view execution history.
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

      {/* Node Config / Editable Parameters */}
      {onUpdateConfig && (
        <div className="space-y-3 p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <span>Node Configuration</span>
            {selectedNode.status === 'success' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Synchronized
              </span>
            )}
          </div>

          {/* Files to Stage field */}
          {(selectedNode.type === 'stage' || selectedNode.type === 'working_tree') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-neutral-500">
                  Target Files to Stage
                </label>
                {localFiles.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig(selectedNode.id, {
                          selectedFiles: localFiles.map((f) => f.path),
                          filesChangedCount: localFiles.length,
                        })
                      }
                      className="text-neutral-900 dark:text-neutral-100 hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-400">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig(selectedNode.id, {
                          selectedFiles: [],
                          filesChangedCount: 0,
                        })
                      }
                      className="text-neutral-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {localFiles.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                  {localFiles.map((file) => {
                    const isSelected =
                      selectedNode.config.selectedFiles?.includes(file.path) ?? false;
                    return (
                      <label
                        key={file.path}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer text-[11px] font-mono select-none"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const prev = selectedNode.config.selectedFiles || [];
                              const next = e.target.checked
                                ? [...prev, file.path]
                                : prev.filter((p) => p !== file.path);
                              onUpdateConfig(selectedNode.id, {
                                selectedFiles: next,
                                filesChangedCount: next.length,
                              });
                            }}
                            className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                          />
                          <span className="truncate text-neutral-800 dark:text-neutral-200">
                            {file.path}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                            file.status === 'added'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : file.status === 'deleted'
                              ? 'bg-rose-500/10 text-rose-500'
                              : file.status === 'untracked'
                              ? 'bg-neutral-500/10 text-neutral-400'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {file.status}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. src/app/page.tsx, README.md (or empty for all)"
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
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
                />
              )}

              <div className="text-[10px] text-neutral-400 font-mono">
                {selectedNode.config.selectedFiles && selectedNode.config.selectedFiles.length > 0
                  ? `Staging ${selectedNode.config.selectedFiles.length} file(s): git add ${selectedNode.config.selectedFiles.join(' ')}`
                  : 'Staging all modified files: git add .'}
              </div>
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
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 text-xs resize-none"
              />
            </div>
          )}

          {/* Branch Name & Divergence Info */}
          {(selectedNode.type === 'branch' || selectedNode.type === 'push' || selectedNode.type === 'pull') && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-neutral-500">
                  Branch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. main, feature/auth"
                  value={selectedNode.config.branchName || ''}
                  onChange={(e) => onUpdateConfig(selectedNode.id, { branchName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
                />
              </div>

              {/* Branch Divergence (Ahead / Behind) */}
              {selectedNode.type === 'branch' && (selectedNode.config.aheadBy !== undefined || selectedNode.config.behindBy !== undefined) && (
                <div className="space-y-2 p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Sync vs {selectedNode.config.baseBranchName || 'main'}
                    </span>
                    {selectedNode.config.aheadBy === 0 && selectedNode.config.behindBy === 0 ? (
                      <span className="text-neutral-500 font-mono text-[10px]">Up to date</span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-400">Diverged</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-center">
                      <div className="text-[10px] text-neutral-400 font-medium">Ahead</div>
                      <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        {selectedNode.config.aheadBy ?? 0}
                      </div>
                      <div className="text-[9px] text-neutral-400">unmerged commits</div>
                    </div>

                    <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-center">
                      <div className="text-[10px] text-neutral-400 font-medium">Behind</div>
                      <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 flex items-center justify-center gap-0.5">
                        <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        {selectedNode.config.behindBy ?? 0}
                      </div>
                      <div className="text-[9px] text-neutral-400">commits behind</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Files Committed on this Branch */}
              {selectedNode.type === 'branch' && selectedNode.config.branchFiles && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Files className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Committed Files</span>
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {selectedNode.config.branchFiles.length} file{selectedNode.config.branchFiles.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* File Search */}
                  {selectedNode.config.branchFiles.length > 5 && (
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2.5 top-2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search branch files..."
                        value={branchFileSearch}
                        onChange={(e) => setBranchFileSearch(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                      />
                    </div>
                  )}

                  {/* File List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 p-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    {selectedNode.config.branchFiles
                      .filter((f) => !branchFileSearch || f.path.toLowerCase().includes(branchFileSearch.toLowerCase()))
                      .map((f) => (
                        <div
                          key={f.path}
                          className="p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/60 flex items-center justify-between gap-2 text-[11px] font-mono"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase flex-shrink-0 ${
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
                          <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
                            {f.additions > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400">+{f.additions}</span>
                            )}
                            {f.deletions > 0 && (
                              <span className="text-rose-600 dark:text-rose-400">-{f.deletions}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    {selectedNode.config.branchFiles.length === 0 && (
                      <div className="text-center py-3 text-[10px] text-neutral-400">
                        No unique files committed in this branch compared to {selectedNode.config.baseBranchName || 'main'}.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remote Name field */}
          {/* Remote Name field */}
          {(selectedNode.type === 'push' || selectedNode.type === 'pull') && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-neutral-500">
                Remote
              </label>
              <input
                type="text"
                placeholder="origin"
                value={selectedNode.config.remoteName || 'origin'}
                onChange={(e) => onUpdateConfig(selectedNode.id, { remoteName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
              />
            </div>
          )}

          {/* Plugin / Custom Node Parameters */}
          {selectedNode.type === 'plugin' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                <span>Plugin Configuration</span>
                {selectedNode.config.pluginName && (
                  <span className="font-mono text-[10px] text-neutral-400">
                    {selectedNode.config.pluginName}
                  </span>
                )}
              </div>

              {selectedNode.config.commandTemplate && (
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  $ {selectedNode.config.commandTemplate}
                </div>
              )}

              {selectedNode.config.customParams && Object.keys(selectedNode.config.customParams).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(selectedNode.config.customParams).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-[11px] font-medium text-neutral-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      {typeof val === 'boolean' ? (
                        <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={(e) => {
                              const updated = { ...selectedNode.config.customParams, [key]: e.target.checked };
                              onUpdateConfig(selectedNode.id, { customParams: updated });
                            }}
                            className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                          />
                          <span>Enable {key}</span>
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={String(val)}
                          onChange={(e) => {
                            const updated = { ...selectedNode.config.customParams, [key]: e.target.value };
                            onUpdateConfig(selectedNode.id, { customParams: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-400 py-1">No configurable parameters for this plugin.</div>
              )}
            </div>
          )}

          {/* Direct Execute Trigger */}
          <div className="pt-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full font-semibold"
              disabled={selectedNode.status === 'executing' || (selectedNode.type === 'commit' && !selectedNode.config.commitMessage?.trim())}
              onClick={() => onExecuteAction(selectedNode)}
            >
              <Play className="w-3.5 h-3.5" />
              {selectedNode.status === 'executing'
                ? 'Executing...'
                : selectedNode.type === 'commit'
                ? 'Commit Changes'
                : selectedNode.type === 'stage'
                ? 'Stage Changes'
                : selectedNode.type === 'branch'
                ? 'Switch Branch'
                : selectedNode.type === 'push'
                ? 'Push to Remote'
                : selectedNode.type === 'pull'
                ? 'Pull from Remote'
                : selectedNode.type === 'plugin'
                ? 'Execute Plugin Action'
                : 'Run Status Check'}
            </Button>
          </div>
        </div>
      )}

      {/* Node Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
        <div>
          <div className="text-neutral-500 font-medium">Status</div>
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize mt-0.5">
            {selectedNode.status}
          </div>
        </div>
        <div>
          <div className="text-neutral-500 font-medium">Files</div>
          <div className="font-semibold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">
            {fileCount} file{fileCount !== 1 ? 's' : ''}
          </div>
        </div>
        {selectedNode.config.additions !== undefined && (
          <div>
            <div className="text-neutral-500 font-medium">Additions</div>
            <div className="font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{selectedNode.config.additions}
            </div>
          </div>
        )}
        {selectedNode.config.deletions !== undefined && (
          <div>
            <div className="text-neutral-500 font-medium">Deletions</div>
            <div className="font-semibold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              -{selectedNode.config.deletions}
            </div>
          </div>
        )}
      </div>

      {/* Educational Tip / Best Practice Box */}
      <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          <span>Best Practice</span>
        </div>
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {selectedNode.type === 'working_tree' && 'Inspect uncommitted files with git status before staging to avoid tracking .env or secrets.'}
          {selectedNode.type === 'stage' && 'Stage only files related to a single unit of work. Keep commits atomic and bisect-friendly.'}
          {selectedNode.type === 'commit' && 'Follow conventional commit format (e.g. feat:, fix:, docs:). Keep title under 72 characters.'}
          {selectedNode.type === 'branch' && 'Isolate tasks into topic branches. Prefix branch names with feature/, bugfix/, or hotfix/.'}
          {selectedNode.type === 'push' && 'Verify target remote and branch name before pushing to avoid overwriting shared history.'}
          {selectedNode.type === 'pull' && 'Pull and rebase remote changes regularly to prevent large merge conflict resolutions.'}
        </p>
      </div>

      {/* Execution Log */}
      {selectedNode.config.executionLog?.command && (
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Last Execution
          </h4>
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5 border border-neutral-200/50 dark:border-neutral-700/50">
            <div className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400">
              $ {selectedNode.config.executionLog.command}
            </div>
            {selectedNode.config.executionLog.output && (
              <div className="font-mono text-[10px] text-neutral-500 whitespace-pre-wrap border-t border-neutral-200 dark:border-neutral-700 pt-1.5 mt-1">
                {selectedNode.config.executionLog.output}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commit History */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <GitCommit className="w-3 h-3" /> Branch Commit History
        </h4>

        <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
          {commits.slice(0, 5).map((c) => (
            <div
              key={c.sha}
              className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {c.commit?.message?.split('\n')[0]}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {c.commit?.author?.name || 'Developer'} · {formatRelativeTime(c.commit?.author?.date)}
                </div>
              </div>
              <a
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded flex-shrink-0 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                {c.sha.substring(0, 7)}
              </a>
            </div>
          ))}
          {commits.length === 0 && (
            <div className="text-center text-neutral-400 py-4">
              No commits loaded for this branch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
