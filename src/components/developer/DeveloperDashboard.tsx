import React, { useState, useEffect } from 'react';
import {
  Code2,
  Plus,
  Terminal,
  Shield,
  Globe,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FolderGit2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  Trash2,
  Play,
  Copy,
  Check,
  Search,
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

  // Schema Validator State
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    parsed?: any;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAll = async () => {
    const installed = loadInstalledPlugins();
    setPlugins(installed);

    try {
      const res = await fetch('/api/git/scan-plugins');
      if (res.ok) {
        const data = await res.json();
        setWorkspacePlugins(data.plugins || []);
      }
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, []);

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
      savePlugin({ ...validationResult.parsed, source: 'local', installed: true });
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

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar p-6 space-y-6 bg-neutral-100/50 dark:bg-[#09090b] font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Code2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Developer Studio & Extensibility Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
              Schema v1 Engine
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Author first-class workflow nodes, package zero-config manifests for your external repositories, test custom scripts in a live sandbox, and publish to the community.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onOpenDocs} className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Docs</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingPlugin(null);
              setIsStudioOpen(true);
            }}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Author New Node</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 space-y-1">
          <span className="text-[11px] font-medium text-neutral-500">Authored & Installed</span>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {allMerged.length}
          </div>
          <span className="text-[10px] text-neutral-400">active workflow nodes</span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 space-y-1">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <FolderGit2 className="w-3 h-3" />
            <span>Workspace Discovered</span>
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {workspacePlugins.length}
          </div>
          <span className="text-[10px] text-neutral-400">in .branchwatch/nodes/</span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 space-y-1">
          <span className="text-[11px] font-medium text-neutral-500">Runtimes Supported</span>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            4
          </div>
          <span className="text-[10px] text-neutral-400">Shell, Node, Py, Webhook</span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 space-y-1">
          <span className="text-[11px] font-medium text-neutral-500">Security Model</span>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            Sandboxed
          </div>
          <span className="text-[10px] text-neutral-400">User Clearance Gated</span>
        </div>
      </div>

      {/* Main Content Area: Nodes Manager & Schema Validator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Node Manager */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All ({allMerged.length})
              </button>
              <button
                onClick={() => setFilterTab('workspace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'workspace'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                This Repository ({workspacePlugins.length})
              </button>
              <button
                onClick={() => setFilterTab('local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'local'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                My Local Studio
              </button>
              <button
                onClick={() => setFilterTab('community')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTab === 'community'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Community Addons
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          {/* Node Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filtered.map((node) => (
              <div
                key={node.id}
                className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
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
                          {copiedId === node.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                        node.source === 'workspace'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : node.source === 'local'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {node.source}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
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

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <span>by {typeof node.author === 'string' ? node.author : node.author.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(node)}
                      className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      title="Export Manifest JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlugin(node);
                        setIsStudioOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-[11px]"
                    >
                      Edit
                    </button>
                    {node.source === 'local' && (
                      <button
                        onClick={() => {
                          removePlugin(node.id);
                          loadAll();
                        }}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500"
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
              <div className="col-span-2 text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-xs text-neutral-500">
                No custom nodes match the filter. Click &ldquo;+ Author New Node&rdquo; to create your first script node.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Manifest Validator & Project Porting Guide */}
        <div className="space-y-4">
          {/* Schema v1 Validator */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                Schema v1 Validator
              </span>
              <span className="text-[10px] font-mono text-neutral-400">JSON Linter</span>
            </div>

            <p className="text-[11px] text-neutral-500">
              Paste a custom node JSON manifest to validate its schema before adding it to your repository.
            </p>

            <textarea
              rows={6}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{\n  "schemaVersion": 1,\n  "id": "my-project.test",\n  "name": "Test Runner",\n  "runtime": "shell"\n}'
              className="w-full p-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-lg font-mono text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none focus:outline-none focus:border-neutral-400"
            />

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={handleValidateJson} className="w-full">
                Validate JSON
              </Button>
              {validationResult?.valid && (
                <Button variant="primary" size="sm" onClick={handleImportValidated} className="shrink-0">
                  Import
                </Button>
              )}
            </div>

            {validationResult && (
              <div
                className={`p-2.5 rounded-lg text-[11px] font-mono flex items-start gap-2 ${
                  validationResult.valid
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                )}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>

          {/* Zero-Config Repo Porting Box */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-900 text-neutral-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs text-white">Porting Your Project</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Place your manifests in <code className="text-white font-mono bg-black/50 px-1 py-0.5 rounded">.branchwatch/nodes/*.json</code> at the root of any repository.
            </p>
            <div className="p-2.5 rounded bg-black/60 border border-neutral-800 font-mono text-[10px] text-neutral-300">
              my-app/<br />
              ├── .branchwatch/<br />
              │&nbsp;&nbsp;&nbsp;└── nodes/<br />
              │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── test-guard.json<br />
              └── package.json
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDocs}
              className="w-full text-xs text-black bg-white hover:bg-neutral-200"
            >
              Read Full Porting Spec
            </Button>
          </div>
        </div>
      </div>

      {/* Plugin Studio Modal */}
      {isStudioOpen && (
        <PluginEditorModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          initialPlugin={editingPlugin}
          onPluginSaved={() => {
            loadAll();
            setIsStudioOpen(false);
          }}
        />
      )}
    </div>
  );
};
