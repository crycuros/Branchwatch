import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WorkflowNode, NodeType } from '@/lib/workflowTypes';
import {
  Play,
  Eye,
  Copy,
  Trash2,
  RotateCcw,
  FolderGit2,
  FileCode,
  GitCommit,
  GitBranch,
  Download,
  Upload,
} from 'lucide-react';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  position: ContextMenuPosition | null;
  targetNode: WorkflowNode | null;
  onClose: () => void;
  onExecuteAction: (node: WorkflowNode) => void;
  onInspectNode: (node: WorkflowNode) => void;
  onDuplicateNode: (node: WorkflowNode) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (type: NodeType) => void;
  onResetView: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  position,
  targetNode,
  onClose,
  onExecuteAction,
  onInspectNode,
  onDuplicateNode,
  onDeleteNode,
  onAddNode,
  onResetView,
}) => {
  const [mounted, setMounted] = useState(false);
  const [adjustedPos, setAdjustedPos] = useState<ContextMenuPosition | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!position) {
      setAdjustedPos(null);
      return;
    }

    const menuWidth = 220;
    const menuHeight = 250;

    let posX = position.x;
    let posY = position.y;

    if (posX + menuWidth > window.innerWidth) {
      posX = window.innerWidth - menuWidth - 16;
    }
    if (posY + menuHeight > window.innerHeight) {
      posY = window.innerHeight - menuHeight - 16;
    }

    setAdjustedPos({ x: Math.max(12, posX), y: Math.max(12, posY) });
  }, [position]);

  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!mounted || !adjustedPos || !position) return null;

  const content = (
    <div
      style={{
        position: 'fixed',
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
        zIndex: 99999,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 shadow-2xl backdrop-blur-md p-1.5 font-sans text-xs select-none animate-apple-menu"
    >
      {targetNode ? (
        // Node Context Menu
        <div className="space-y-0.5">
          <div className="px-2.5 py-1.5 font-semibold text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800/80 mb-1 flex items-center justify-between">
            <span className="truncate max-w-[130px]">{targetNode.title}</span>
            <span className="font-mono text-[10px]">#{targetNode.id.substring(0, 7)}</span>
          </div>

          <button
            onClick={() => {
              onExecuteAction(targetNode);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-emerald-500" />
              <span>Execute Action</span>
            </div>
          </button>

          <button
            onClick={() => {
              onInspectNode(targetNode);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-neutral-400" />
              <span>Inspect History</span>
            </div>
          </button>

          <button
            onClick={() => {
              onDuplicateNode(targetNode);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Duplicate Node</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">⌘D</span>
          </button>

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

          <button
            onClick={() => {
              onDeleteNode(targetNode.id);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Node</span>
            </div>
            <span className="text-[10px] text-rose-400 font-mono">Del</span>
          </button>
        </div>
      ) : (
        // Canvas Background Context Menu
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 font-semibold text-[10px] text-neutral-400 uppercase tracking-wider">
            Add Git Node
          </div>

          <button
            onClick={() => {
              onAddNode('working_tree');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Working Tree</span>
          </button>

          <button
            onClick={() => {
              onAddNode('stage');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <FileCode className="w-3.5 h-3.5 text-neutral-400" />
            <span>Stage</span>
          </button>

          <button
            onClick={() => {
              onAddNode('commit');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <GitCommit className="w-3.5 h-3.5 text-neutral-400" />
            <span>Commit</span>
          </button>

          <button
            onClick={() => {
              onAddNode('branch');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
            <span>Branch</span>
          </button>

          <button
            onClick={() => {
              onAddNode('pull');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Pull</span>
          </button>

          <button
            onClick={() => {
              onAddNode('push');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Push</span>
          </button>

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

          <button
            onClick={() => {
              onResetView();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reset Canvas View</span>
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};
