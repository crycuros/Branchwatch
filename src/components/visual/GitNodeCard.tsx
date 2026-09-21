import React from 'react';
import { WorkflowNode, NodeStatusType, NODE_PORT_DEFINITIONS } from '@/lib/workflowTypes';
import {
  FolderGit2, FileCode, GitCommit, GitBranch, Download, Upload,
  CheckCircle2, Clock, AlertCircle, Loader2, Circle, ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface GitNodeCardProps {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, node: WorkflowNode) => void;
  onUpdateConfig: (newConfig: Partial<WorkflowNode['config']>) => void;
  onExecuteAction: (node: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onStartConnectionDrag?: (nodeId: string, portType: 'out') => void;
  isConnectionTarget?: boolean;
  isTargetValid?: boolean;
}

export const GitNodeCard: React.FC<GitNodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onContextMenu,
  onUpdateConfig,
  onExecuteAction,
  onDeleteNode,
  onStartConnectionDrag,
  isConnectionTarget,
  isTargetValid,
}) => {
  const nodeIcons = {
    working_tree: FolderGit2,
    stage: FileCode,
    commit: GitCommit,
    branch: GitBranch,
    pull: Download,
    push: Upload,
  };
  const Icon = nodeIcons[node.type] || GitCommit;
  const portDef = NODE_PORT_DEFINITIONS[node.type];

  const statusBadge = (status: NodeStatusType) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Success
          </span>
        );
      case 'executing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Executing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            <Clock className="w-3 h-3" /> Ready
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
            <Circle className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  return (
    <div
      data-node-id={node.id}
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, node);
      }}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      className={`absolute w-72 rounded-2xl border apple-glass-card shadow-apple dark:shadow-apple-dark transition-all duration-200 select-none group cursor-grab active:cursor-grabbing ${
        node.status === 'executing'
          ? 'border-amber-500/50 ring-2 ring-amber-500/20'
          : node.status === 'failed'
          ? 'border-rose-500/50 ring-2 ring-rose-500/20'
          : isSelected
          ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-400/50 dark:ring-neutral-600/50 z-20'
          : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 z-10'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-neutral-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              node.status === 'executing'
                ? 'bg-amber-500/10 text-amber-500'
                : node.status === 'success'
                ? 'bg-emerald-500/10 text-emerald-500'
                : node.status === 'failed'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            {node.status === 'executing' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
          </div>
          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
            {node.title}
          </span>
        </div>
        {statusBadge(node.status)}
      </div>

      {/* Port type strip */}
      <div className="flex justify-between items-center px-3.5 py-1 bg-neutral-50/60 dark:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800/50">
        <span className="text-[9px] font-mono text-neutral-400">
          {portDef?.input.type === 'None' ? '⊘ no input' : `← ${portDef?.input.type}`}
        </span>
        <span className="text-[9px] font-mono text-neutral-400">
          {portDef?.output.type === 'None' ? '⊘ terminal' : `${portDef?.output.type} →`}
        </span>
      </div>

      {/* Body — Real per-node state */}
      <div className="p-3.5 space-y-3 text-xs">

        {/* WORKING TREE */}
        {node.type === 'working_tree' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
              <span>Uncommitted changes</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {node.config.filesChangedCount || 0} files
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono font-medium text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400">+{node.config.additions || 0}</span>
              <span className="text-rose-600 dark:text-rose-400">-{node.config.deletions || 0}</span>
            </div>
            {node.status === 'success' && node.config.executionLog?.output && (
              <div className="text-[10px] font-mono text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 p-1.5 rounded-lg whitespace-pre-wrap max-h-16 overflow-y-auto">
                {node.config.executionLog.output}
              </div>
            )}
          </div>
        )}

        {/* STAGE */}
        {node.type === 'stage' && (
          <div className="space-y-2">
            {node.config.selectedFiles && node.config.selectedFiles.length > 0 ? (
              <div className="space-y-1">
                {node.config.selectedFiles.slice(0, 3).map((f) => (
                  <div key={f} className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 truncate">
                    + {f}
                  </div>
                ))}
                {node.config.selectedFiles.length > 3 && (
                  <div className="text-[10px] text-neutral-500">
                    +{node.config.selectedFiles.length - 3} more files
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] font-mono text-neutral-500">git add .</div>
            )}
            {node.status !== 'success' && node.status !== 'executing' && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={(e) => { e.stopPropagation(); onExecuteAction(node); }}
              >
                Stage Changes
              </Button>
            )}
            {node.status === 'success' && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Changes staged
              </div>
            )}
          </div>
        )}

        {/* COMMIT */}
        {node.type === 'commit' && (
          <div className="space-y-2.5">
            {node.status === 'success' && node.config.sha ? (
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center justify-between">
                  <span>{node.config.sha}</span>
                  {node.config.commitUrl && (
                    <a
                      href={node.config.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-emerald-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="text-[10px] text-neutral-500 italic truncate">
                  {node.config.commitMessage}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Commit Message
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fix button hover states"
                    value={node.config.commitMessage || ''}
                    onChange={(e) => onUpdateConfig({ commitMessage: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 text-xs ${
                      !node.config.commitMessage?.trim()
                        ? 'border-rose-300 dark:border-rose-700'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {!node.config.commitMessage?.trim() && (
                    <div className="text-[10px] text-rose-500 mt-0.5">⚠ Commit message required</div>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-medium"
                  disabled={!node.config.commitMessage?.trim() || node.status === 'executing'}
                  onClick={(e) => { e.stopPropagation(); onExecuteAction(node); }}
                >
                  {node.status === 'executing' ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Committing...</>
                  ) : (
                    'Commit Changes'
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {/* BRANCH */}
        {node.type === 'branch' && (
          <div className="space-y-2">
            <div
              className={`font-mono font-semibold text-xs flex items-center gap-1.5 ${
                node.status === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {node.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
              {node.config.branchName || 'main'}
            </div>
            {node.config.sha && (
              <div className="text-[10px] font-mono text-neutral-500">HEAD: {node.config.sha}</div>
            )}
            {node.status !== 'success' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => { e.stopPropagation(); onExecuteAction(node); }}
              >
                Switch to Branch
              </Button>
            )}
          </div>
        )}

        {/* PULL */}
        {node.type === 'pull' && (
          <div className="space-y-2">
            <div className="text-neutral-500 font-mono text-[11px]">
              git pull {node.config.remoteName || 'origin'} {node.config.branchName || 'main'}
            </div>
            {node.status !== 'success' && node.status !== 'executing' && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={(e) => { e.stopPropagation(); onExecuteAction(node); }}
              >
                Pull Latest
              </Button>
            )}
          </div>
        )}

        {/* PUSH */}
        {node.type === 'push' && (
          <div className="space-y-2">
            <div className="text-neutral-500 font-mono text-[11px]">
              git push {node.config.remoteName || 'origin'} {node.config.branchName || 'HEAD'}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
              <AlertCircle className="w-3 h-3" /> Sends commits to remote
            </div>
            {node.status !== 'success' && node.status !== 'executing' && (
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={(e) => { e.stopPropagation(); onExecuteAction(node); }}
              >
                Push to Remote
              </Button>
            )}
          </div>
        )}

        {/* Execution log output — shown after single-node execution */}
        {node.config.executionLog?.output && node.type !== 'working_tree' && (
          <div className="text-[10px] font-mono text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 p-1.5 rounded-lg whitespace-pre-wrap max-h-14 overflow-y-auto border border-neutral-200/50 dark:border-neutral-700/50">
            {node.config.executionLog.output}
          </div>
        )}
      </div>

      {/* Input Port (left) */}
      <div
        id={`port-in-${node.id}`}
        className={`absolute -left-1.5 top-[68px] -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-900 transition-all z-30 ${
          isConnectionTarget
            ? isTargetValid
              ? 'bg-emerald-500 scale-150 ring-4 ring-emerald-500/30'
              : 'bg-rose-500 scale-150 ring-4 ring-rose-500/30 animate-pulse'
            : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
      />

      {/* Output Port (right) */}
      <div
        id={`port-out-${node.id}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnectionDrag) onStartConnectionDrag(node.id, 'out');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnectionDrag) onStartConnectionDrag(node.id, 'out');
        }}
        className="absolute -right-1.5 top-[68px] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-900 dark:hover:bg-white border-2 border-white dark:border-neutral-900 cursor-crosshair hover:scale-125 transition-transform z-30"
        title="Drag to connect to another node"
      />
    </div>
  );
};
