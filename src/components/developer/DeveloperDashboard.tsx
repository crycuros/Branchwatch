import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  Plus,
  Terminal,
  Shield,
  Globe,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FolderGit2,
  BookOpen,
  Trash2,
  Play,
  Copy,
  Check,
  Search,
  Cpu,
  GitPullRequest,
  ExternalLink,
  Zap,
  HardDrive,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { PluginNodeDefinition } from '@/lib/pluginTypes';
import { loadInstalledPlugins, removePlugin, savePlugin } from '@/lib/pluginStorage';
import { PluginEditorModal } from '../plugins/PluginEditorModal';
import { Button } from '../ui/Button';

interface DeveloperDashboardProps {
  onOpenDocs: () => void;
  onOpenWorkflow: () => void;
  currentRepoPath?: string;
}

interface DetectedTool {
  id: string;
  name: string;
  category: string;
  description: string;
  filesMatched: string[];
  suggestedNode: Partial<PluginNodeDefinition>;
}

const OPEN_SOURCE_STARTERS: Partial<PluginNodeDefinition>[] = [
  {
    id: 'starter.secret-scanner',
    name: 'Secret & API Key Leak Guard',
    description: 'Scans staged git diffs for leaked AWS keys, private tokens, or unencrypted .env credentials.',
    category: 'security',
    runtime: 'shell',
    iconName: 'Shield',
    permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
    commandTemplate: 'git diff --cached | grep -iE "apiKey|secret|private_key|password|bearer" && exit 1 || exit 0',
    inputPort: { type: 'StagedChanges', label: 'Staged' },
    outputPort: { type: 'StagedChanges', label: 'Staged' },
    onFailure: 'halt',
  },
  {
    id: 'starter.semantic-commits',
    name: 'Conventional Commit Validator',
    description: 'Enforces standard conventional commits (feat:, fix:, chore:, refactor:, docs:) on branch stack.',
    category: 'git',
    runtime: 'nodejs',
    iconName: 'GitCommit',
    permissions: { shell: false, filesystem: 'workspace', git: true, network: false },
    commandTemplate: `const branch = process.env.BW_CURRENT_BRANCH || '';\nconst files = (process.env.BW_COMMITTED_FILES || '').split(',');\nconsole.log('Validating branch formatting:', branch);\nprocess.exit(0);`,
    inputPort: { type: 'BranchRef', label: 'Branch' },
    outputPort: { type: 'BranchRef', label: 'Branch' },
    onFailure: 'halt',
  },
  {
    id: 'starter.slack-notifier',
    name: 'Slack / Discord Release Broadcaster',
    description: 'Dispatches branch deployment events and execution telemetry to remote team webhook channels.',
    category: 'notification',
    runtime: 'webhook',
    iconName: 'Globe',
    permissions: { shell: false, filesystem: 'none', git: false, network: true },
    webhookConfig: {
      url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      method: 'POST',
      bodyTemplate: '{\n  "text": "BranchWatch Workflow Complete on branch {{BRANCH}}"\n}',
    },
    inputPort: { type: 'RemoteRef', label: 'Remote' },
    outputPort: { type: 'None', label: 'None' },
    onFailure: 'continue',
  },
  {
    id: 'starter.docker-smoke',
    name: 'Docker Container Smoke Build',
    description: 'Executes clean Docker container builds to guarantee reproducible production builds.',
    category: 'devops',
    runtime: 'shell',
    iconName: 'Archive',
    permissions: { shell: true, filesystem: 'workspace', git: true, network: true },
    commandTemplate: 'docker build -t branchwatch-smoke-test .',
    inputPort: { type: 'BranchRef', label: 'Branch' },
    outputPort: { type: 'RemoteRef', label: 'Remote' },
    onFailure: 'halt',
  },
];

const SDK_SNIPPETS = {
  nodejs: `// @branchwatch/node-sdk drop-in snippet
const branch = process.env.BW_CURRENT_BRANCH;
const repoPath = process.env.BW_REPO_PATH;
const files = (process.env.BW_COMMITTED_FILES || '').split(',');
const aheadCount = parseInt(process.env.BW_AHEAD_COUNT || '0', 10);

console.log(\`[BranchWatch] Processing branch: \${branch} with \${files.length} changed files\`);

// Perform custom operations
if (aheadCount > 10) {
  console.error("Error: Branch is more than 10 commits ahead of base. Please rebase first.");
  process.exit(1);
}

process.exit(0);`,
  python: `# branchwatch.py helper snippet
import os
import sys

branch = os.environ.get("BW_CURRENT_BRANCH", "main")
repo_path = os.environ.get("BW_REPO_PATH", ".")
files = os.environ.get("BW_COMMITTED_FILES", "").split(",")
ahead = int(os.environ.get("BW_AHEAD_COUNT", "0"))

print(f"[BranchWatch PyNode] Branch: {branch}, Changed files: {len(files)}")

# Exit code 0 signals success to Visual Workflow
sys.exit(0)`,
  shell: `#!/usr/bin/env bash
# BranchWatch Shell Task Wrapper
set -e

echo "[BranchWatch] Verifying branch: \${BW_CURRENT_BRANCH}"
echo "[BranchWatch] Files staged: \${BW_COMMITTED_FILES}"

# Run CLI tasks
npm test
npm run lint

echo "[BranchWatch] All quality gates passed."
exit 0`,
};

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  onOpenDocs,
  onOpenWorkflow,
  currentRepoPath,
}) => {
  const [plugins, setPlugins] = useState<PluginNodeDefinition[]>([]);
  const [workspacePlugins, setWorkspacePlugins] = useState<PluginNodeDefinition[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'workspace' | 'local' | 'community'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<PluginNodeDefinition | null>(null);

  // Stack Detection State
  const [detectedTools, setDetectedTools] = useState<DetectedTool[]>([]);
  const [isScanningStack, setIsScanningStack] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedSuccess, setGeneratedSuccess] = useState<string | null>(null);

  // Active Center Tab
  const [dashboardTab, setDashboardTab] = useState<'nodes' | 'starters' | 'sdk' | 'validator'>('nodes');
  const [selectedSdkLang, setSelectedSdkLang] = useState<'nodejs' | 'python' | 'shell'>('nodejs');
  const [copiedSdk, setCopiedSdk] = useState(false);

  // Schema Validator State
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    parsed?: any;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const installed = loadInstalledPlugins();
    setPlugins(installed);

    try {
      const res = await fetch('/api/git/scan-plugins');
      if (res.ok) {
        const data = await res.json();
        setWorkspacePlugins(data.plugins || []);
      }
    } catch {}
  }, []);

  const scanWorkspaceStack = useCallback(async () => {
    setIsScanningStack(true);
    try {
      const res = await fetch('/api/git/detect-stack');
      if (res.ok) {
        const data = await res.json();
        setDetectedTools(data.tools || []);
      }
    } catch (err) {
      console.error('Failed to scan workspace stack:', err);
    } finally {
      setIsScanningStack(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    scanWorkspaceStack();
  }, [loadAll, scanWorkspaceStack]);

  const handleGenerateNodeToWorkspace = async (tool: DetectedTool) => {
    setGeneratingId(tool.id);
    try {
      const res = await fetch('/api/git/write-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: {
            ...tool.suggestedNode,
            author: { name: 'Repository Contributor', login: 'workspace' },
            version: '1.0.0',
            inputs: { branch: '{{BRANCH}}' },
            outputs: { exitCode: '$EXIT_CODE' },
            installed: true,
          },
        }),
      });
      if (res.ok) {
        setGeneratedSuccess(tool.id);
        setTimeout(() => setGeneratedSuccess(null), 3000);
        await loadAll();
      }
    } catch (err) {
      console.error('Failed to generate workspace node:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleInstallStarter = async (starter: Partial<PluginNodeDefinition>) => {
    const manifest = {
      schemaVersion: 1 as const,
      id: starter.id || `starter.${Date.now()}`,
      name: starter.name || 'Starter Node',
      version: '1.0.0',
      description: starter.description || '',
      author: { name: 'BranchWatch Open Source', login: 'branchwatch' },
      iconName: starter.iconName || 'Terminal',
      category: starter.category || 'automation',
      runtime: starter.runtime || 'shell',
      permissions: starter.permissions || { shell: true, filesystem: 'workspace', git: true, network: false },
      commandTemplate: starter.commandTemplate,
      webhookConfig: starter.webhookConfig,
      inputPort: starter.inputPort || { type: 'BranchRef', label: 'Branch' },
      outputPort: starter.outputPort || { type: 'BranchRef', label: 'Branch' },
      configSchema: [],
      source: 'local' as const,
      installed: true,
      createdAt: new Date().toISOString(),
    };
    savePlugin(manifest as PluginNodeDefinition);
    await loadAll();
  };

  const allMerged = [
    ...workspacePlugins.map((p) => ({ ...p, source: 'workspace' as const })),
    ...plugins.filter((p) => !workspacePlugins.some((wp) => wp.id === p.id)),
  ];

  const filtered = allMerged.filter((p) => {
    if (filterTab === 'workspace' && p.source !== 'workspace') return false;
    if (filterTab === 'local' && p.source !== 'local') return false;
    if (filterTab === 'community' && p.source !== 'community') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.runtime.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleValidateJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.id) throw new Error("Missing required field 'id'");
      if (!parsed.name) throw new Error("Missing required field 'name'");
      if (!parsed.runtime) throw new Error("Missing required field 'runtime'");

      setValidationResult({
        valid: true,
        message: `Valid BranchWatch Schema v1 Manifest (${parsed.runtime} runtime, id: ${parsed.id})`,
        parsed,
      });
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: `Schema Validation Error: ${err.message}`,
      });
    }
  };

  const handleImportValidated = () => {
    if (validationResult?.valid && validationResult.parsed) {
      savePlugin({ ...validationResult.parsed, source: 'local', installed: true, createdAt: new Date().toISOString() });
      loadAll();
      setJsonInput('');
      setValidationResult(null);
    }
  };

  const handleDownload = (plugin: PluginNodeDefinition) => {
    const blob = new Blob([JSON.stringify(plugin, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plugin.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopySdk = () => {
    navigator.clipboard.writeText(SDK_SNIPPETS[selectedSdkLang]);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar p-6 space-y-6 bg-neutral-100/50 dark:bg-[#09090b] font-sans">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm">
              <Code2 className="w-5 h-5 stroke-[2.5]" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Developer Studio
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
              Schema v1 Engine
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Author first-class workflow nodes, package zero-config manifests into <code className="font-mono text-neutral-800 dark:text-neutral-200">.branchwatch/nodes/</code>, test in the sandbox, and publish to the open-source community registry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onOpenDocs} className="gap-1.5 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingPlugin(null);
              setIsStudioOpen(true);
            }}
            className="gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Author Node</span>
          </Button>
        </div>
      </div>

      {/* 2. Workspace Stack Auto-Detection Section */}
      {detectedTools.length > 0 && (
        <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Detected Workspace Stack ({detectedTools.length} tool{detectedTools.length === 1 ? '' : 's'})
                </h2>
                <p className="text-[11px] text-neutral-500">
                  BranchWatch detected your repository stack. Generate native workflow nodes with 1 click.
                </p>
              </div>
            </div>

            <button
              onClick={scanWorkspaceStack}
              disabled={isScanningStack}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isScanningStack ? 'animate-spin' : ''}`} />
              <span>Rescan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {detectedTools.map((tool) => {
              const isAlreadyInstalled = workspacePlugins.some((wp) => wp.id === tool.suggestedNode.id);
              return (
                <div
                  key={tool.id}
                  className="p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {tool.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase">
                        {tool.suggestedNode.runtime}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded border border-neutral-200/50 dark:border-neutral-800/60">
                      $ {tool.suggestedNode.commandTemplate || 'script'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/40 dark:border-neutral-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {tool.filesMatched.join(', ')}
                    </span>
                    <Button
                      variant={isAlreadyInstalled ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleGenerateNodeToWorkspace(tool)}
                      disabled={generatingId === tool.id || isAlreadyInstalled}
                      className="text-[11px] py-1 h-7"
                    >
                      {isAlreadyInstalled ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Generated</span>
                        </>
                      ) : generatedSuccess === tool.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Added!</span>
                        </>
                      ) : generatingId === tool.id ? (
                        <span>Writing...</span>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Add to Workspace</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Studio Navigation Subheader Tabs */}
      <div className="flex items-center border-b border-neutral-200/80 dark:border-neutral-800 gap-6 text-xs select-none">
        <button
          onClick={() => setDashboardTab('nodes')}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-all ${
            dashboardTab === 'nodes'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Active Nodes</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {allMerged.length}
          </span>
        </button>

        <button
          onClick={() => setDashboardTab('starters')}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-all ${
            dashboardTab === 'starters'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Open-Source Starters</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            {OPEN_SOURCE_STARTERS.length}
          </span>
        </button>

        <button
          onClick={() => setDashboardTab('sdk')}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-all ${
            dashboardTab === 'sdk'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>SDK Helpers</span>
        </button>

        <button
          onClick={() => setDashboardTab('validator')}
          className={`pb-3 font-medium flex items-center gap-2 border-b-2 transition-all ${
            dashboardTab === 'validator'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Schema Validator</span>
        </button>
      </div>

      {/* 4. Tab 1: Active Nodes Manager */}
      {dashboardTab === 'nodes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All ({allMerged.length})
              </button>
              <button
                onClick={() => setFilterTab('workspace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'workspace'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                This Repository ({workspacePlugins.length})
              </button>
              <button
                onClick={() => setFilterTab('local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'local'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                My Local Studio
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((node) => (
              <div
                key={node.id}
                className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          {node.name}
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-400">v{node.version}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-neutral-400 truncate">
                          {node.id}
                        </span>
                        <button
                          onClick={() => handleCopyId(node.id)}
                          className="text-neutral-400 hover:text-neutral-200"
                          title="Copy ID"
                        >
                          {copiedId === node.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                        node.source === 'workspace'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {node.source}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {node.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase font-semibold">
                      {node.runtime}
                    </span>
                    {node.permissions?.shell && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        shell
                      </span>
                    )}
                    {node.permissions?.network && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        network
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                      {node.inputPort.type} ➔ {node.outputPort.type}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="text-[10px] text-neutral-400">
                    by {typeof node.author === 'string' ? node.author : node.author.name}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(node)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      title="Export Manifest JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlugin(node);
                        setIsStudioOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-xs"
                    >
                      Edit
                    </button>
                    {node.source === 'local' && (
                      <button
                        onClick={() => {
                          removePlugin(node.id);
                          loadAll();
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-xs text-neutral-500">
                No custom nodes match the filter. Click &ldquo;+ Author Node&rdquo; to build your first script.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Open-Source Starters */}
      {dashboardTab === 'starters' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Open-Source Node Starters & Boilerplates
            </h2>
            <p className="text-[11px] text-neutral-500">
              Production-ready workflow building blocks that you can fork, edit, or install directly into your project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPEN_SOURCE_STARTERS.map((starter) => (
              <div
                key={starter.id}
                className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {starter.name}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {starter.runtime}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {starter.description}
                  </p>
                  {starter.commandTemplate && (
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-neutral-50 dark:bg-neutral-950 p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800 truncate">
                      $ {starter.commandTemplate}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400">
                    Ports: {starter.inputPort?.type} ➔ {starter.outputPort?.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPlugin(starter as PluginNodeDefinition);
                        setIsStudioOpen(true);
                      }}
                      className="text-xs"
                    >
                      Customize in Studio
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleInstallStarter(starter)}
                      className="text-xs"
                    >
                      Install Node
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: SDK Helpers & Wrappers */}
      {dashboardTab === 'sdk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                BranchWatch SDK Helper Reference
              </h2>
              <p className="text-[11px] text-neutral-500">
                Drop-in boilerplate templates to easily interact with injected BranchWatch runtime variables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                {(['nodejs', 'python', 'shell'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedSdkLang(lang)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase transition-colors ${
                      selectedSdkLang === lang
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'nodejs' ? 'Node.js' : lang}
                  </button>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={handleCopySdk} className="text-xs">
                {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSdk ? 'Copied' : 'Copy Snippet'}</span>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
            <pre>{SDK_SNIPPETS[selectedSdkLang]}</pre>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Schema v1 Validator */}
      {dashboardTab === 'validator' && (
        <div className="space-y-4 max-w-3xl">
          <div className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                Schema v1 Manifest Linter & Validator
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Open-Source Spec</span>
            </div>

            <p className="text-xs text-neutral-500">
              Paste a custom node JSON manifest below to validate its compliance with BranchWatch Schema v1.
            </p>

            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{\n  "schemaVersion": 1,\n  "id": "my-project.test",\n  "name": "Test Runner",\n  "runtime": "shell",\n  "commandTemplate": "npm test"\n}'
              className="w-full p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none focus:outline-none focus:border-neutral-400"
            />

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={handleValidateJson} className="w-full">
                Validate Manifest
              </Button>
              {validationResult?.valid && (
                <Button variant="primary" size="sm" onClick={handleImportValidated} className="shrink-0">
                  Import to Studio
                </Button>
              )}
            </div>

            {validationResult && (
              <div
                className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 ${
                  validationResult.valid
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plugin Studio Modal */}
      {isStudioOpen && (
        <PluginEditorModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          initialPlugin={editingPlugin}
          repoPath={currentRepoPath}
          onPluginSaved={() => {
            loadAll();
            setIsStudioOpen(false);
          }}
        />
      )}
    </div>
  );
};
