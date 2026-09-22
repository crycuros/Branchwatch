import React from 'react';
import { Shield, ShieldAlert, Terminal, Globe, HardDrive, GitBranch, Check, X, AlertTriangle } from 'lucide-react';
import { WorkflowNode } from '@/lib/workflowTypes';

interface PermissionModalProps {
  isOpen: boolean;
  node: WorkflowNode | null;
  onAuthorize: (scope: 'once' | 'session' | 'always') => void;
  onCancel: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  node,
  onAuthorize,
  onCancel,
}) => {
  if (!isOpen || !node) return null;

  const perms = node.config.permissions || {
    filesystem: 'workspace',
    shell: true,
    git: true,
    network: false,
  };

  const runtime = node.config.runtime || 'shell';
  const isCommunity = node.config.pluginSource === 'community';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">Execution Security Clearance</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {runtime}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Node &ldquo;{node.title}&rdquo; requires permission to run on your machine.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Node Identifier:</span>
              <span className="font-mono text-zinc-200">{node.config.pluginId || node.id}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Source:</span>
              <span className="capitalize font-mono text-zinc-200">{node.config.pluginSource || 'Workspace / Local'}</span>
            </div>
            {node.config.commandTemplate && (
              <div className="mt-2 pt-2 border-t border-zinc-800">
                <span className="text-[11px] text-zinc-500 block mb-1">Command / Script:</span>
                <code className="text-[11px] font-mono text-zinc-300 bg-zinc-950 px-2 py-1 rounded block truncate">
                  {node.config.commandTemplate}
                </code>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-300">Requested Permissions:</span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Shell Execution */}
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                  perms.shell
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                    : 'bg-zinc-900/30 border-zinc-900 text-zinc-500'
                }`}
              >
                <Terminal className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-medium text-[11px]">Shell Execution</div>
                  <div className="text-[10px] text-zinc-500">Run local CLI processes</div>
                </div>
              </div>

              {/* Filesystem */}
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                  perms.filesystem && perms.filesystem !== 'none'
                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-200'
                    : 'bg-zinc-900/30 border-zinc-900 text-zinc-500'
                }`}
              >
                <HardDrive className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-medium text-[11px]">Filesystem</div>
                  <div className="text-[10px] text-zinc-500">
                    {perms.filesystem === 'all' ? 'Full System' : 'Workspace Only'}
                  </div>
                </div>
              </div>

              {/* Git Operations */}
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                  perms.git
                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-200'
                    : 'bg-zinc-900/30 border-zinc-900 text-zinc-500'
                }`}
              >
                <GitBranch className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-medium text-[11px]">Git Context</div>
                  <div className="text-[10px] text-zinc-500">Read & modify Git state</div>
                </div>
              </div>

              {/* Network */}
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                  perms.network
                    ? 'bg-blue-500/5 border-blue-500/20 text-blue-300'
                    : 'bg-zinc-900/30 border-zinc-900 text-zinc-500'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-medium text-[11px]">Network Access</div>
                  <div className="text-[10px] text-zinc-500">Outbound HTTP Webhooks</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-start gap-2.5 text-xs text-zinc-400">
            <AlertTriangle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <span>
              Scripts run with the permissions of your user account in the active repository directory.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-900/30 flex items-center justify-between gap-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAuthorize('session')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
            >
              Allow for Session
            </button>
            <button
              onClick={() => onAuthorize('always')}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-black bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Always Trust & Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
