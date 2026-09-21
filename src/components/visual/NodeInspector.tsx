import React from 'react';
import { WorkflowNode } from '@/lib/workflowTypes';
import { Commit } from '@/lib/types';
import { GitCommit, ExternalLink, Trash2, X, Clock, Play, GitBranch, Upload, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface NodeInspectorProps {
  selectedNode: WorkflowNode | null;
  commits: Commit[];
  onDeleteNode: (id: string) => void;
  onExecuteAction: (node: WorkflowNode) => void;
  onCloseInspector?: () => void;
  onUpdateConfig?: (id: string, newConfig: Partial<WorkflowNode['config']>) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  commits,
  onDeleteNode,
  onExecuteAction,
  onCloseInspector,
  onUpdateConfig,
}) => {
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

          {/* Branch Name field */}
          {(selectedNode.type === 'branch' || selectedNode.type === 'push' || selectedNode.type === 'pull') && (
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
          )}

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

          {/* Direct Execute Trigger */}
          <div className="pt-1">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
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
