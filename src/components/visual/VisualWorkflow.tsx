import React, { useState, useEffect, useCallback } from 'react';
import { WorkflowNode, NodeConnection, NodeType, ExecutionStep, WorkflowValidationIssue } from '@/lib/workflowTypes';
import { generateGitCommands, buildNodesFromRepoData } from '@/lib/workflowGenerator';
import { validateWorkflowGraph } from '@/lib/nodeValidation';
import { generateExecutionPlan, executeStep } from '@/lib/workflowExecutor';
import { executeWorkflowViaGitHub, ExecutionResult } from '@/lib/githubExecutor';
import { Commit, Branch } from '@/lib/types';
import { CommunityWorkflow } from '@/lib/communityTypes';
import { NodeCanvas } from './NodeCanvas';
import { TerminalPreview } from './TerminalPreview';
import { NodeInspector } from './NodeInspector';
import { NodeContextMenu } from './NodeContextMenu';
import { WorkflowPublishModal } from '../community/WorkflowPublishModal';

import {
  Plus, Minus, RotateCcw, Save, Undo, Redo,
  FolderGit2, FileCode, GitCommit, GitBranch, Download, Upload,
  Layers, Maximize2, Minimize2, Terminal as TerminalIcon, X,
  GitBranch as LogoIcon, Info, Play, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Globe, BookOpen, Edit3, GitFork, ArrowRight, ArrowLeft, ExternalLink, Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface VisualWorkflowProps {
  token?: string | null;
  currentBranchName: string;
  branches: Branch[];
  commits: Commit[];
  repoFullName?: string;
  initialWorkflow?: CommunityWorkflow | null;
  authUser?: { login: string; name?: string; avatar_url?: string } | null;
  onExecuteCommit: (message: string) => Promise<void>;
  onExecuteStage: () => Promise<void>;
  onExecuteSwitchBranch: (branchName: string) => Promise<void>;
  onOpenCommunity?: () => void;
}

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: 'node-wt',
    type: 'working_tree',
    title: 'Working Tree',
    x: 60,
    y: 200,
    status: 'ready',
    config: { filesChangedCount: 0, additions: 0, deletions: 0 },
  },
  {
    id: 'node-stage',
    type: 'stage',
    title: 'Stage',
    x: 380,
    y: 200,
    status: 'draft',
    config: { selectedFiles: [] },
  },
];

const INITIAL_CONNECTIONS: NodeConnection[] = [
  { id: 'conn-1', fromId: 'node-wt', toId: 'node-stage' },
];

type WorkflowRunMode = 'idle' | 'dryrun' | 'executing' | 'done';
type ViewMode = 'editor' | 'documentation';

export const VisualWorkflow: React.FC<VisualWorkflowProps> = ({
  token,
  currentBranchName,
  branches,
  commits,
  repoFullName,
  initialWorkflow,
  authUser,
  onExecuteCommit,
  onExecuteStage,
  onExecuteSwitchBranch,
  onOpenCommunity,
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialWorkflow?.nodes || INITIAL_NODES);
  const [connections, setConnections] = useState<NodeConnection[]>(initialWorkflow?.connections || INITIAL_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [forkMeta, setForkMeta] = useState(initialWorkflow?.forkedFrom || null);

  // Workflow Execution State
  const [runMode, setRunMode] = useState<WorkflowRunMode>('idle');
  const [executionPlan, setExecutionPlan] = useState<ExecutionStep[]>([]);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<WorkflowValidationIssue[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Panel Toggles
  const [showLibrary, setShowLibrary] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showInspector, setShowInspector] = useState(true);

  // Context Menu
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuTargetNode, setContextMenuTargetNode] = useState<WorkflowNode | null>(null);

  // Undo/Redo
  const [history, setHistory] = useState<{ nodes: WorkflowNode[]; connections: NodeConnection[] }[]>([
    { nodes: initialWorkflow?.nodes || INITIAL_NODES, connections: initialWorkflow?.connections || INITIAL_CONNECTIONS },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Hydrate canvas from initialWorkflow if provided, or live repo data
  useEffect(() => {
    if (initialWorkflow) {
      setNodes(initialWorkflow.nodes);
      setConnections(initialWorkflow.connections);
      setHistory([{ nodes: initialWorkflow.nodes, connections: initialWorkflow.connections }]);
      setHistoryIndex(0);
      setForkMeta(initialWorkflow.forkedFrom || null);
      if (initialWorkflow.nodes.length > 0) setSelectedNodeId(initialWorkflow.nodes[0].id);
      return;
    }

    const { nodes: liveNodes, connections: liveConns } = buildNodesFromRepoData(
      currentBranchName,
      branches,
      commits
    );
    setNodes(liveNodes);
    setConnections(liveConns);
    setHistory([{ nodes: liveNodes, connections: liveConns }]);
    setHistoryIndex(0);
    setLastSyncTime(new Date());

    const firstInteresting = liveNodes.find((n) => n.type === 'commit' || n.type === 'branch');
    if (firstInteresting) setSelectedNodeId(firstInteresting.id);
  }, [commits, branches, currentBranchName, initialWorkflow]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (runMode === 'dryrun') { setRunMode('idle'); return; }
        if (isFullscreen) { setIsFullscreen(false); return; }
      }

      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) return;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault(); handleUndo();
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault(); handleRedo();
      }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) handleDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, selectedNodeId, historyIndex, history, runMode]);

  const pushState = (newNodes: WorkflowNode[], newConns: NodeConnection[]) => {
    const nextHist = history.slice(0, historyIndex + 1);
    nextHist.push({ nodes: newNodes, connections: newConns });
    setHistory(nextHist);
    setHistoryIndex(nextHist.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setConnections(prev.connections);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setConnections(next.connections);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const handleAddNode = (type: NodeType) => {
    const titles: Record<NodeType, string> = {
      working_tree: 'Working Tree',
      stage: 'Stage',
      commit: 'Commit',
      branch: 'Branch',
      pull: 'Pull',
      push: 'Push',
    };

    const newId = `node-${Date.now()}`;
    const newNode: WorkflowNode = {
      id: newId,
      type,
      title: titles[type],
      x: 200 + nodes.length * 30,
      y: 180 + (nodes.length % 3) * 40,
      status: 'draft',
      config: {
        commitMessage: type === 'commit' ? '' : undefined,
        branchName: type === 'branch' || type === 'push' || type === 'pull'
          ? currentBranchName
          : undefined,
      },
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(newId);
    pushState(updated, connections);
  };

  const handleDuplicateNode = (target: WorkflowNode) => {
    const newId = `node-${Date.now()}`;
    const dup: WorkflowNode = { ...target, id: newId, x: target.x + 40, y: target.y + 40, status: 'draft' };
    const updated = [...nodes, dup];
    setNodes(updated);
    setSelectedNodeId(newId);
    pushState(updated, connections);
  };

  const handleConnectNodes = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const exists = connections.some((c) => c.fromId === fromId && c.toId === toId);
    if (exists) return;
    const newConn: NodeConnection = { id: `conn-${Date.now()}`, fromId, toId };
    const updated = [...connections, newConn];
    setConnections(updated);
    pushState(nodes, updated);
  };

  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const handleUpdateConfig = (id: string, newConfig: Partial<WorkflowNode['config']>) => {
    const updated = nodes.map((n) =>
      n.id === id ? { ...n, config: { ...n.config, ...newConfig } } : n
    );
    setNodes(updated);
    pushState(updated, connections);
  };

  const handleDeleteNode = (id: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== id);
    const updatedConns = connections.filter((c) => c.fromId !== id && c.toId !== id);
    setNodes(updatedNodes);
    setConnections(updatedConns);
    if (selectedNodeId === id) setSelectedNodeId(null);
    pushState(updatedNodes, updatedConns);
  };

  const handleDeleteConnection = (connId: string) => {
    const updated = connections.filter((c) => c.id !== connId);
    setConnections(updated);
    pushState(nodes, updated);
  };

  // Single-node execution (when clicking Run button on a node directly)
  const handleExecuteAction = async (node: WorkflowNode) => {
    // Mark as executing
    setNodes((prev) => prev.map((n) => n.id === node.id ? { ...n, status: 'executing' } : n));

    await new Promise((r) => setTimeout(r, 800));

    if (node.type === 'commit') {
      const msg = node.config.commitMessage || 'Update repository';
      await onExecuteCommit(msg);
      const sha = Math.random().toString(16).substring(2, 9);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? { ...n, status: 'success', config: { ...n.config, sha, committedAt: new Date().toISOString(), executionLog: { command: `git commit -m "${msg}"`, output: `[${currentBranchName} ${sha}] ${msg}\n 2 files changed`, completedAt: new Date().toISOString() } } }
            : n
        )
      );
    } else if (node.type === 'stage') {
      await onExecuteStage();
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? { ...n, status: 'success', config: { ...n.config, executionLog: { command: 'git add .', output: 'Changes staged for commit', completedAt: new Date().toISOString() } } }
            : n
        )
      );
    } else if (node.type === 'branch' && node.config.branchName) {
      await onExecuteSwitchBranch(node.config.branchName);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? { ...n, status: 'success', config: { ...n.config, executionLog: { command: `git switch ${node.config.branchName}`, output: `Switched to branch '${node.config.branchName}'`, completedAt: new Date().toISOString() } } }
            : n
        )
      );
    } else {
      // For pull/push/working_tree — simulate
      await new Promise((r) => setTimeout(r, 600));
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id ? { ...n, status: 'success' } : n
        )
      );
    }
  };

  // Run Workflow — Step 1: Validate, then show Dry Run
  const handleRunWorkflow = () => {
    const issues = validateWorkflowGraph(nodes, connections);
    const errors = issues.filter((i) => i.type === 'error');

    if (errors.length > 0) {
      setValidationIssues(issues);
      setShowValidation(true);
      return;
    }

    const plan = generateExecutionPlan(nodes, connections);
    setExecutionPlan(plan.map((s) => ({ ...s, status: 'queued' as const })));
    setValidationIssues(issues); // may have warnings
    setRunMode('dryrun');
    setShowTerminal(true);
  };

  // Run Workflow — Step 2: Execute plan
  const handleConfirmExecute = async () => {
    setRunMode('executing');
    setExecutionResult(null);

    // Live Execution directly against GitHub REST API
    if (token && repoFullName) {
      try {
        const result = await executeWorkflowViaGitHub(
          nodes,
          connections,
          repoFullName,
          currentBranchName || 'main',
          token,
          (nodeId, status, output, sha) => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      status,
                      config: {
                        ...n.config,
                        ...(sha ? { sha } : {}),
                        ...(output ? { executionLog: { output, completedAt: new Date().toISOString() } } : {}),
                      },
                    }
                  : n
              )
            );

            setExecutionPlan((prev) =>
              prev.map((s) =>
                s.nodeId === nodeId
                  ? {
                      ...s,
                      status: status === 'executing' ? ('executing' as const) : status === 'success' ? ('success' as const) : ('failed' as const),
                      output,
                    }
                  : s
              )
            );
          },
          () => {}
        );

        setExecutionResult(result);
        setRunMode('done');
        return;
      } catch (err: any) {
        setExecutionResult({
          success: false,
          stepsRun: 0,
          totalSteps: executionPlan.length,
          logs: [],
          errorMessage: err.message || 'Workflow execution failed',
        });
        setRunMode('done');
        return;
      }
    }

    // Fallback: Simulation for unauthenticated demo
    let currentPlan = [...executionPlan];

    for (let i = 0; i < currentPlan.length; i++) {
      currentPlan = currentPlan.map((s, idx) =>
        idx === i ? { ...s, status: 'executing' as const } : s
      );
      setExecutionPlan([...currentPlan]);

      setNodes((prev) =>
        prev.map((n) => n.id === currentPlan[i].nodeId ? { ...n, status: 'executing' } : n)
      );

      try {
        const result = await executeStep(currentPlan[i], (nodeId, status, output, sha) => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    status,
                    config: {
                      ...n.config,
                      ...(sha ? { sha } : {}),
                      ...(output ? { executionLog: { output, completedAt: new Date().toISOString() } } : {}),
                    },
                  }
                : n
            )
          );
        });

        currentPlan = currentPlan.map((s, idx) =>
          idx === i ? { ...result, status: 'success' as const } : s
        );
        setExecutionPlan([...currentPlan]);
      } catch (err) {
        currentPlan = currentPlan.map((s, idx) =>
          idx === i ? { ...s, status: 'failed' as const, error: String(err) } : s
        );
        setExecutionPlan([...currentPlan]);
        setNodes((prev) =>
          prev.map((n) => n.id === currentPlan[i].nodeId ? { ...n, status: 'failed' } : n)
        );
        break;
      }
    }

    setRunMode('done');
  };

  const handleCancelExecute = () => {
    setRunMode('idle');
    setExecutionPlan([]);
    setExecutionResult(null);
  };

  const handleResetCanvas = () => {
    setRunMode('idle');
    setExecutionPlan([]);
    setExecutionResult(null);
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'draft' as const })));
  };

  const handleContextMenu = (e: React.MouseEvent, node: WorkflowNode | null) => {
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuTargetNode(node);
  };

  const handleAutoLayout = () => {
    const baseX = 60;
    const stepX = 320;
    const centerY = 200;
    const updated = nodes.map((n, idx) => ({
      ...n,
      x: baseX + idx * stepX,
      y: centerY,
    }));
    setNodes(updated);
    pushState(updated, connections);
  };

  const generatedCommands = generateGitCommands(nodes, connections);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const terminalMode = runMode === 'dryrun' ? 'dryrun' : runMode === 'executing' ? 'executing' : runMode === 'done' ? 'done' : 'preview';

  // Validation panel overlay
  const ValidationPanel = () => {
    if (!showValidation) return null;
    const errors = validationIssues.filter((i) => i.type === 'error');
    const warnings = validationIssues.filter((i) => i.type === 'warning');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md mx-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Workflow Validation Failed</span>
            </div>
            <button onClick={() => setShowValidation(false)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-2">
            {errors.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400">
                <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
            {warnings.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4">
            <button
              onClick={() => setShowValidation(false)}
              className="w-full py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Fix Issues
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Branch Context Bar
  const BranchContextBar = ({ dark = false }: { dark?: boolean }) => (
    <div className={`flex items-center gap-3 text-[11px] font-mono ${dark ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
      {repoFullName && (
        <span className={`px-2 py-0.5 rounded ${dark ? 'bg-neutral-800' : 'bg-neutral-100 dark:bg-neutral-800'} text-inherit`}>
          {repoFullName}
        </span>
      )}
      <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${dark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100'}`}>
        <GitBranch className="w-3 h-3" /> {currentBranchName || 'main'}
      </span>
      {lastSyncTime && (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );

  // ============================================================
  // FULLSCREEN MODE
  // ============================================================
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 w-full h-full bg-[#09090b] text-neutral-100 flex flex-col font-sans select-none overflow-hidden animate-fade-in">
        <ValidationPanel />
        <header className="h-14 border-b border-neutral-800 bg-[#0c0d0f]/90 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-neutral-900 shadow-sm">
              <LogoIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-sm tracking-tight">Visual Canvas</span>
            <BranchContextBar dark />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              <button onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 transition-colors" title="Zoom out">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 font-mono text-xs text-neutral-400">{Math.round(zoomScale * 100)}%</span>
              <button onClick={() => setZoomScale((z) => Math.min(1.6, z + 0.1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 transition-colors" title="Zoom in">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoomScale(1)} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 transition-colors ml-1" title="Reset zoom">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 transition-colors" title="Undo">
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 transition-colors" title="Redo">
                <Redo className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={handleAutoLayout} title="Auto-arrange nodes">
              <RefreshCw className="w-3.5 h-3.5" /> Layout
            </Button>

            <Button
              variant={runMode === 'idle' ? 'primary' : 'ghost'}
              size="sm"
              onClick={runMode === 'done' ? handleResetCanvas : handleRunWorkflow}
              disabled={runMode === 'executing'}
              className={runMode === 'executing' ? 'opacity-50' : ''}
            >
              <Play className="w-3.5 h-3.5" />
              {runMode === 'idle' ? 'Run Workflow' : runMode === 'dryrun' ? 'Review...' : runMode === 'executing' ? 'Running...' : 'Reset'}
            </Button>

            <Button variant="outline" size="sm" onClick={() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }}>
              <Save className="w-3.5 h-3.5" />
              {saveStatus === 'saved' ? 'Saved!' : 'Save'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowLibrary(!showLibrary)} className={showLibrary ? 'bg-neutral-800 text-white' : 'text-neutral-400'}>
              <Layers className="w-4 h-4" /> Nodes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowInspector(!showInspector)} className={showInspector ? 'bg-neutral-800 text-white' : 'text-neutral-400'}>
              <Info className="w-4 h-4" /> Inspector
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTerminal(!showTerminal)} className={showTerminal ? 'bg-neutral-800 text-white' : 'text-neutral-400'}>
              <TerminalIcon className="w-4 h-4" /> Terminal
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="w-4 h-4" /> Exit
            </Button>
          </div>
        </header>

        <div className="flex-1 w-full h-full relative overflow-hidden">
          {showLibrary && (
            <div className="absolute left-6 top-6 z-30 w-52 p-4 rounded-2xl border border-neutral-800 bg-[#0f1013]/90 backdrop-blur-md shadow-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-400">Node Library</span>
                <button onClick={() => setShowLibrary(false)} className="text-neutral-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
              <NodeLibraryList onAddNode={handleAddNode} dark />
            </div>
          )}

          <NodeCanvas
            nodes={nodes}
            connections={connections}
            selectedNodeId={selectedNodeId}
            zoomScale={zoomScale}
            onZoomChange={(s) => setZoomScale(s)}
            onSelectNode={(id) => { setSelectedNodeId(id); if (id) setShowInspector(true); }}
            onMoveNode={handleMoveNode}
            onUpdateNodeConfig={handleUpdateConfig}
            onExecuteAction={handleExecuteAction}
            onDeleteNode={handleDeleteNode}
            onContextMenu={handleContextMenu}
            onConnectNodes={handleConnectNodes}
            onDeleteConnection={handleDeleteConnection}
          />

          {showTerminal && (
            <div className="absolute right-6 top-6 z-30 shadow-2xl animate-fade-in">
              <TerminalPreview
                commands={generatedCommands}
                mode={terminalMode as any}
                executionSteps={executionPlan}
                onConfirmExecute={handleConfirmExecute}
                onCancelExecute={handleCancelExecute}
              />
            </div>
          )}

          {showInspector && selectedNode && (
            <div className="absolute right-6 bottom-6 z-30 w-80 shadow-2xl animate-fade-in max-h-[70vh] overflow-y-auto no-scrollbar rounded-2xl border border-neutral-800 bg-[#0f1013]/95 backdrop-blur-md">
              <div className="flex items-center justify-between p-3 border-b border-neutral-800 text-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-400">Inspector</span>
                <button onClick={() => setShowInspector(false)} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3">
                <NodeInspector
                  selectedNode={selectedNode}
                  commits={commits}
                  onDeleteNode={handleDeleteNode}
                  onExecuteAction={handleExecuteAction}
                  onUpdateConfig={handleUpdateConfig}
                />
              </div>
            </div>
          )}
        </div>

        <NodeContextMenu
          position={contextMenuPos}
          targetNode={contextMenuTargetNode}
          onClose={() => setContextMenuPos(null)}
          onExecuteAction={handleExecuteAction}
          onInspectNode={(n) => setSelectedNodeId(n.id)}
          onDuplicateNode={handleDuplicateNode}
          onDeleteNode={handleDeleteNode}
          onAddNode={handleAddNode}
          onResetView={() => setZoomScale(1)}
        />
      </div>
    );
  }

  // ============================================================
  // STANDARD IN-PAGE VIEW
  // ============================================================
  return (
    <div className="space-y-4 w-full h-full min-h-0 flex flex-col font-sans overflow-y-auto no-scrollbar pb-10">
      <ValidationPanel />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex-shrink-0">
        <div className="space-y-1.5">
          {initialWorkflow && onOpenCommunity && (
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={onOpenCommunity}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Community Hub</span>
              </button>
              <span className="text-neutral-400 dark:text-neutral-600">/</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {initialWorkflow.title}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {initialWorkflow ? initialWorkflow.title : 'Visual Git Workflow'}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
              {initialWorkflow ? 'Community Recipe' : 'V2 Engine'}
            </span>

            {initialWorkflow && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                <span>by @{initialWorkflow.author.login}</span>
              </div>
            )}

            {forkMeta && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                <GitFork className="w-3 h-3 text-neutral-500" />
                <span>Forked from @{forkMeta.author.login}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
              <span>Target Repo:</span>
              <BranchContextBar />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher: Editor vs Documentation */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 text-xs">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('documentation')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'documentation'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Docs Mode</span>
            </button>
          </div>

          {viewMode === 'editor' && (
            <>
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 text-xs">
                <button onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.1))} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300 transition-colors" title="Zoom out">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] text-neutral-500">{Math.round(zoomScale * 100)}%</span>
                <button onClick={() => setZoomScale((z) => Math.min(1.6, z + 0.1))} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300 transition-colors" title="Zoom in">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setZoomScale(1)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300 transition-colors ml-1" title="Reset zoom">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
                <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 transition-colors" title="Undo (Ctrl+Z)">
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 transition-colors" title="Redo (Ctrl+Shift+Z)">
                  <Redo className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button variant="ghost" size="sm" onClick={handleAutoLayout} title="Auto-arrange nodes left to right">
                <RefreshCw className="w-3.5 h-3.5" /> Auto Layout
              </Button>

              <Button
                variant={runMode === 'idle' ? 'primary' : 'ghost'}
                size="sm"
                onClick={runMode === 'done' ? handleResetCanvas : handleRunWorkflow}
                disabled={runMode === 'executing'}
              >
                <Play className="w-3.5 h-3.5" />
                {runMode === 'idle' ? 'Run Workflow' : runMode === 'dryrun' ? 'Review Running...' : runMode === 'executing' ? 'Running...' : 'Reset Canvas'}
              </Button>

              <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(true)} title="Fullscreen mode">
                <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowPublishModal(true)} title="Publish workflow to Community">
            <Globe className="w-3.5 h-3.5" /> Publish
          </Button>

          <Button variant="outline" size="sm" onClick={() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }}>
            <Save className="w-3.5 h-3.5" />
            {saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </div>

      {/* DOCUMENTATION / READ MODE */}
      {viewMode === 'documentation' ? (
        <div className="space-y-6 max-w-4xl mx-auto py-4 animate-fade-in">
          <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Workflow Documentation Walkthrough</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {initialWorkflow?.title || `${currentBranchName || 'Feature'} Git Pipeline`}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {initialWorkflow?.description || 'A step-by-step educational breakdown of this Git execution graph.'}
            </p>
          </div>

          <div className="space-y-4">
            {nodes.map((node, index) => {
              const note = initialWorkflow?.educationalNotes?.[node.id];
              return (
                <div
                  key={node.id}
                  className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 space-y-3 shadow-subtle"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs font-mono">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {note?.title || node.title}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 capitalize">
                          {node.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {note?.explanation || `Executes operation for ${node.title} in the repository sequence.`}
                  </p>

                  <div className="p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-xs">
                    <span className="text-neutral-500 select-none">$ </span>
                    <span>
                      {note?.command ||
                        (node.type === 'stage'
                          ? 'git add .'
                          : node.type === 'commit'
                          ? `git commit -m "${node.config.commitMessage || 'Update repository'}"`
                          : node.type === 'branch'
                          ? `git switch ${node.config.branchName || 'main'}`
                          : node.type === 'push'
                          ? `git push ${node.config.remoteName || 'origin'} ${node.config.branchName || 'HEAD'}`
                          : 'git status')}
                    </span>
                  </div>

                  {note?.bestPracticeTip && (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50 text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">Tip: </strong>
                      {note.bestPracticeTip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CANVAS EDITOR MODE */
        <>
          {/* Validation Warnings Banner (non-blocking warnings only) */}
          {validationIssues.filter((i) => i.type === 'warning').length > 0 && runMode === 'dryrun' && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-xs flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{validationIssues.filter((i) => i.type === 'warning').length} warning{validationIssues.filter((i) => i.type === 'warning').length > 1 ? 's' : ''} — {validationIssues.filter((i) => i.type === 'warning')[0].message}</span>
            </div>
          )}

          {/* Main Canvas Workspace */}
          <div className="min-h-[460px] h-[520px] w-full flex flex-col lg:flex-row gap-4 items-stretch relative flex-shrink-0">
            {/* Node Library */}
            <div className="w-full lg:w-52 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-3 flex-shrink-0 h-full overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-400">Node Library</span>
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <NodeLibraryList onAddNode={handleAddNode} />
            </div>

            {/* Canvas */}
            <div className="flex-1 h-full min-w-0 relative overflow-hidden rounded-2xl">
              <NodeCanvas
                nodes={nodes}
                connections={connections}
                selectedNodeId={selectedNodeId}
                zoomScale={zoomScale}
                onZoomChange={(s) => setZoomScale(s)}
                onSelectNode={(id) => setSelectedNodeId(id)}
                onMoveNode={handleMoveNode}
                onUpdateNodeConfig={handleUpdateConfig}
                onExecuteAction={handleExecuteAction}
                onDeleteNode={handleDeleteNode}
                onContextMenu={handleContextMenu}
                onConnectNodes={handleConnectNodes}
                onDeleteConnection={handleDeleteConnection}
              />
            </div>

            {/* Terminal Panel */}
            <div className="h-full flex-shrink-0">
              <TerminalPreview
                commands={generatedCommands}
                mode={terminalMode as any}
                executionSteps={executionPlan}
                onConfirmExecute={handleConfirmExecute}
                onCancelExecute={handleCancelExecute}
              />
            </div>
          </div>

          {/* Node Inspector */}
          <div className="w-full flex-shrink-0">
            <NodeInspector
              selectedNode={selectedNode}
              commits={commits}
              onDeleteNode={handleDeleteNode}
              onExecuteAction={handleExecuteAction}
              onUpdateConfig={handleUpdateConfig}
              onCloseInspector={() => setSelectedNodeId(null)}
            />
          </div>
        </>
      )}

      {/* Execution Result Modal */}
      {executionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-6 space-y-5 animate-apple-modal"
          >
            {executionResult.success ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Workflow Executed on GitHub!
                    </h3>
                    <p className="text-xs text-neutral-500">
                      All {executionResult.stepsRun} operations completed on {repoFullName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  {executionResult.createdBranch && (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">Created Branch</div>
                      <div className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{executionResult.createdBranch}</span>
                      </div>
                    </div>
                  )}

                  {executionResult.commitSha && (
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">New Commit Object</div>
                      <div className="font-mono text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                        <span>SHA: {executionResult.commitSha.substring(0, 7)}</span>
                        {executionResult.commitUrl && (
                          <a
                            href={executionResult.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-sans text-xs"
                          >
                            <span>View on GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (executionResult.createdBranch) {
                        onExecuteSwitchBranch(executionResult.createdBranch);
                      }
                      setExecutionResult(null);
                    }}
                  >
                    <span>Done</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Workflow Execution Failed
                    </h3>
                    <p className="text-xs text-neutral-500">GitHub API reported an issue</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-600 dark:text-rose-300 leading-relaxed font-mono">
                  {executionResult.errorMessage}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button variant="outline" size="sm" onClick={() => setExecutionResult(null)}>
                    <span>Close & Fix</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Publish to Community Modal */}
      <WorkflowPublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        nodes={nodes}
        connections={connections}
        currentBranchName={currentBranchName}
        authUser={authUser}
        onPublishSuccess={() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }}
      />

      {/* Context Menu */}
      <NodeContextMenu
        position={contextMenuPos}
        targetNode={contextMenuTargetNode}
        onClose={() => setContextMenuPos(null)}
        onExecuteAction={handleExecuteAction}
        onInspectNode={(n) => setSelectedNodeId(n.id)}
        onDuplicateNode={handleDuplicateNode}
        onDeleteNode={handleDeleteNode}
        onAddNode={handleAddNode}
        onResetView={() => setZoomScale(1)}
      />
    </div>
  );
};

// Shared Node Library button list
const NODE_LIBRARY_ITEMS: { type: NodeType; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { type: 'working_tree', label: 'Working Tree', Icon: FolderGit2 },
  { type: 'stage', label: 'Stage', Icon: FileCode },
  { type: 'commit', label: 'Commit', Icon: GitCommit },
  { type: 'branch', label: 'Branch', Icon: GitBranch },
  { type: 'pull', label: 'Pull', Icon: Download },
  { type: 'push', label: 'Push', Icon: Upload },
];

const NodeLibraryList: React.FC<{ onAddNode: (type: NodeType) => void; dark?: boolean }> = ({ onAddNode, dark }) => (
  <div className="space-y-1.5 text-xs">
    {NODE_LIBRARY_ITEMS.map(({ type, label, Icon }) => (
      <button
        key={type}
        onClick={() => onAddNode(type)}
        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors font-medium ${
          dark
            ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-200'
            : 'border-neutral-200/60 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
        }`}
      >
        <Icon className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`} />
        <span>{label}</span>
      </button>
    ))}
  </div>
);
