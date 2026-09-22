import React, { useState } from 'react';
import { PluginNodeDefinition, PluginCategory, ConfigFieldSchema, PluginRuntime } from '@/lib/pluginTypes';
import { PortDataType, NodePermissions } from '@/lib/workflowTypes';
import { savePlugin } from '@/lib/pluginStorage';
import {
  X,
  Plus,
  Trash2,
  Code2,
  CheckCircle2,
  GitBranch,
  GitCommit,
  FileCode,
  FolderGit2,
  Download,
  Archive,
  GitMerge,
  Tag,
  GitPullRequest,
  Play,
  Settings2,
  Shield,
  Globe,
  Terminal,
  Clock,
  Sparkles,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PluginEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPluginSaved: (plugin: PluginNodeDefinition) => void;
  initialPlugin?: PluginNodeDefinition | null;
  repoPath?: string;
  currentBranch?: string;
}

const AVAILABLE_ICONS = [
  { name: 'Terminal', Icon: Terminal, label: 'CLI / Terminal' },
  { name: 'ShieldCheck', Icon: Shield, label: 'Testing / Guard' },
  { name: 'Globe', Icon: Globe, label: 'Webhook / Network' },
  { name: 'Archive', Icon: Archive, label: 'Archive / Stash' },
  { name: 'GitMerge', Icon: GitMerge, label: 'Merge / Rebase' },
  { name: 'Tag', Icon: Tag, label: 'Tag / Release' },
  { name: 'GitPullRequest', Icon: GitPullRequest, label: 'Pull Request' },
  { name: 'GitBranch', Icon: GitBranch, label: 'Branch' },
  { name: 'GitCommit', Icon: GitCommit, label: 'Commit' },
  { name: 'FileCode', Icon: FileCode, label: 'File Code' },
  { name: 'FolderGit2', Icon: FolderGit2, label: 'Folder' },
  { name: 'Trash2', Icon: Trash2, label: 'Prune / Cleanup' },
  { name: 'Settings2', Icon: Settings2, label: 'Config / Tool' },
];

const PORT_TYPES: { type: PortDataType; label: string }[] = [
  { type: 'BranchRef', label: 'Branch Reference' },
  { type: 'CommitRef', label: 'Commit Reference' },
  { type: 'WorkingTreeChanges', label: 'Working Tree Changes' },
  { type: 'StagedChanges', label: 'Staged Changes' },
  { type: 'RemoteRef', label: 'Remote Reference' },
  { type: 'None', label: 'None (Standalone)' },
];

export const PluginEditorModal: React.FC<PluginEditorModalProps> = ({
  isOpen,
  onClose,
  onPluginSaved,
  initialPlugin,
  repoPath,
  currentBranch,
}) => {
  const [name, setName] = useState(initialPlugin?.name || 'Custom Workflow Action');
  const [id, setId] = useState(initialPlugin?.id || `custom.${Date.now().toString().slice(-6)}`);
  const [description, setDescription] = useState(
    initialPlugin?.description || 'A custom project node crafted for BranchWatch.'
  );
  const [category, setCategory] = useState<PluginCategory>(initialPlugin?.category || 'automation');
  const [iconName, setIconName] = useState(initialPlugin?.iconName || 'Terminal');
  const [authorName, setAuthorName] = useState(
    typeof initialPlugin?.author === 'string'
      ? initialPlugin.author
      : initialPlugin?.author?.name || 'Developer'
  );
  const [version, setVersion] = useState(initialPlugin?.version || '1.0.0');

  const [runtime, setRuntime] = useState<PluginRuntime>(initialPlugin?.runtime || 'shell');

  // Ports
  const [inputPort, setInputPort] = useState<PortDataType>(initialPlugin?.inputPort?.type || 'BranchRef');
  const [outputPort, setOutputPort] = useState<PortDataType>(initialPlugin?.outputPort?.type || 'BranchRef');

  // Script & Command Templates
  const [commandTemplate, setCommandTemplate] = useState(
    initialPlugin?.commandTemplate ||
      (initialPlugin?.runtime === 'nodejs'
        ? `console.log("Branch:", process.env.BW_CURRENT_BRANCH);\nconsole.log("Committed files:", process.env.BW_COMMITTED_FILES);\nprocess.exit(0);`
        : initialPlugin?.runtime === 'python'
        ? `import os, sys\nbranch = os.environ.get("BW_CURRENT_BRANCH")\nprint(f"Running check on {branch}...")\nsys.exit(0)`
        : 'npm test')
  );

  // Webhook Config
  const [webhookUrl, setWebhookUrl] = useState(initialPlugin?.webhookConfig?.url || 'https://api.example.com/webhook');
  const [webhookMethod, setWebhookMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>(
    initialPlugin?.webhookConfig?.method || 'POST'
  );
  const [webhookBody, setWebhookBody] = useState(
    initialPlugin?.webhookConfig?.bodyTemplate ||
      '{\n  "event": "branchwatch.step",\n  "branch": "{{BRANCH}}",\n  "status": "ready"\n}'
  );

  // Permissions
  const [permissions, setPermissions] = useState<NodePermissions>(
    initialPlugin?.permissions || {
      filesystem: 'workspace',
      shell: true,
      git: true,
      network: false,
    }
  );

  // Parameters / Config Fields
  const [configFields, setConfigFields] = useState<ConfigFieldSchema[]>(
    initialPlugin?.configSchema || []
  );

  // Composable Inputs / Outputs
  const [inputs, setInputs] = useState<Record<string, string>>(initialPlugin?.inputs || { branch: '{{BRANCH}}' });
  const [outputs, setOutputs] = useState<Record<string, string>>(
    initialPlugin?.outputs || { exitCode: '$EXIT_CODE', stdout: '$STDOUT' }
  );

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'code' | 'metadata' | 'permissions' | 'runner' | 'json'>('code');
  const [isSaved, setIsSaved] = useState(false);

  // Test Runner State
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [testLogs, setTestLogs] = useState<{ stdout: string; stderr: string; exitCode?: number; status?: number; durationMs?: number } | null>(null);

  if (!isOpen) return null;

  const handleAddField = () => {
    const newKey = `param_${Date.now().toString().slice(-4)}`;
    setConfigFields((prev) => [
      ...prev,
      {
        key: newKey,
        label: 'New Parameter',
        type: 'text',
        placeholder: 'Value...',
        defaultValue: '',
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setConfigFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, updates: Partial<ConfigFieldSchema>) => {
    setConfigFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const handleInsertToken = (token: string) => {
    setCommandTemplate((prev) => `${prev} ${token}`);
  };

  const handleTestRun = async () => {
    setTestStatus('running');
    setTestLogs(null);

    try {
      const res = await fetch('/api/workflow/run-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: id,
          nodeTitle: name,
          runtime,
          command: runtime === 'shell' ? commandTemplate : undefined,
          scriptContent: runtime !== 'shell' && runtime !== 'webhook' ? commandTemplate : undefined,
          repoPath,
          webhookConfig: runtime === 'webhook' ? { url: webhookUrl, method: webhookMethod, bodyTemplate: webhookBody } : undefined,
          context: {
            branch: currentBranch || 'main',
            baseBranch: 'main',
            ahead: 3,
            behind: 0,
            committedFiles: [{ path: 'src/index.ts', status: 'modified', additions: 12, deletions: 2 }],
          },
        }),
      });

      const data = await res.json();
      setTestLogs({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode,
        status: data.status,
        durationMs: data.durationMs,
      });

      setTestStatus(data.success ? 'success' : 'failed');
    } catch (err: any) {
      setTestLogs({
        stdout: '',
        stderr: err.message || 'Execution failed',
        exitCode: 1,
        durationMs: 0,
      });
      setTestStatus('failed');
    }
  };

  const buildManifest = (): PluginNodeDefinition => {
    return {
      schemaVersion: 1,
      id,
      name,
      version,
      description,
      author: { name: authorName },
      homepage: '',
      tags: [category, runtime],
      platforms: ['windows', 'linux', 'darwin'],
      iconName,
      category,
      runtime,
      permissions,
      inputPort: {
        type: inputPort,
        label: PORT_TYPES.find((p) => p.type === inputPort)?.label || 'Input',
      },
      outputPort: {
        type: outputPort,
        label: PORT_TYPES.find((p) => p.type === outputPort)?.label || 'Output',
      },
      configSchema: configFields,
      commandTemplate: runtime === 'shell' ? commandTemplate : undefined,
      scriptContent: runtime !== 'shell' && runtime !== 'webhook' ? commandTemplate : undefined,
      webhookConfig:
        runtime === 'webhook'
          ? {
              url: webhookUrl,
              method: webhookMethod,
              bodyTemplate: webhookBody,
            }
          : undefined,
      inputs,
      outputs,
      source: 'local',
      installed: true,
      createdAt: initialPlugin?.createdAt || new Date().toISOString(),
    };
  };

  const handleSave = () => {
    const manifest = buildManifest();
    savePlugin(manifest);
    onPluginSaved(manifest);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleDownloadJson = () => {
    const manifest = buildManifest();
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">BranchWatch Script & Node Studio</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Schema v1
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Author custom CLI scripts, webhooks, or portable nodes with typed inputs, outputs, and permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-zinc-900 bg-zinc-950 text-xs select-none">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('code')}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'border-zinc-200 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Script & Code
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'border-zinc-200 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'metadata'
                  ? 'border-zinc-200 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Metadata & Ports
            </button>
            <button
              onClick={() => setActiveTab('runner')}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'runner'
                  ? 'border-zinc-200 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Test Console
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'border-zinc-200 text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Manifest JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Runtime:</span>
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
              {(['shell', 'nodejs', 'python', 'webhook'] as PluginRuntime[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRuntime(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors capitalize ${
                    runtime === r
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {r === 'nodejs' ? 'Node.js' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: SCRIPT & CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              {runtime === 'webhook' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">Method</label>
                      <select
                        value={webhookMethod}
                        onChange={(e) => setWebhookMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">Webhook URL</label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/... or http://localhost:8080/events"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      JSON Request Body Template
                    </label>
                    <textarea
                      rows={8}
                      value={webhookBody}
                      onChange={(e) => setWebhookBody(e.target.value)}
                      className="w-full p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-200 leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      {runtime === 'shell'
                        ? 'Shell Command / CLI Script'
                        : `${runtime === 'nodejs' ? 'Node.js' : 'Python'} Script Source`}
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                      <span>Injected Context:</span>
                      <button
                        onClick={() => handleInsertToken('{{BW_CURRENT_BRANCH}}')}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        {'{{BRANCH}}'}
                      </button>
                      <button
                        onClick={() => handleInsertToken('{{BW_REPO_PATH}}')}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        {'{{REPO}}'}
                      </button>
                      <button
                        onClick={() => handleInsertToken('{{BW_AHEAD_COUNT}}')}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        {'{{AHEAD}}'}
                      </button>
                    </div>
                  </div>

                  <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-xs">
                    <textarea
                      rows={12}
                      value={commandTemplate}
                      onChange={(e) => setCommandTemplate(e.target.value)}
                      placeholder={
                        runtime === 'shell'
                          ? 'e.g. npm test && npm run lint'
                          : runtime === 'nodejs'
                          ? 'console.log("Branch:", process.env.BW_CURRENT_BRANCH);'
                          : 'import os\nprint(os.environ.get("BW_CURRENT_BRANCH"))'
                      }
                      className="w-full p-4 bg-transparent text-zinc-200 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    💡 Standard environment variables <code className="text-zinc-400 font-mono">BW_REPO_PATH</code>, <code className="text-zinc-400 font-mono">BW_CURRENT_BRANCH</code>, and <code className="text-zinc-400 font-mono">BW_COMMITTED_FILES</code> are automatically injected into the process.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200">Execution Permission Matrix</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Declare the exact system capabilities this node requires. Users will review and approve these permissions before first execution.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.shell ?? true}
                    onChange={(e) => setPermissions({ ...permissions, shell: e.target.checked })}
                    className="mt-0.5 rounded bg-zinc-800 border-zinc-700 text-zinc-200"
                  />
                  <div>
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      Shell Execution
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Spawns local sub-processes (PowerShell, bash, npm, docker).
                    </div>
                  </div>
                </label>

                <label className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.network ?? false}
                    onChange={(e) => setPermissions({ ...permissions, network: e.target.checked })}
                    className="mt-0.5 rounded bg-zinc-800 border-zinc-700 text-zinc-200"
                  />
                  <div>
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Network & Webhooks
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Allows outbound HTTP requests to remote APIs and services.
                    </div>
                  </div>
                </label>

                <label className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.git ?? true}
                    onChange={(e) => setPermissions({ ...permissions, git: e.target.checked })}
                    className="mt-0.5 rounded bg-zinc-800 border-zinc-700 text-zinc-200"
                  />
                  <div>
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                      Git Workspace Access
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Reads and modifies local Git branches, refs, and diffs.
                    </div>
                  </div>
                </label>

                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-start gap-3">
                  <div className="w-full">
                    <div className="text-xs font-medium text-zinc-200 mb-1.5">Filesystem Scope</div>
                    <select
                      value={permissions.filesystem || 'workspace'}
                      onChange={(e) => setPermissions({ ...permissions, filesystem: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300"
                    >
                      <option value="workspace">Workspace Repository Only</option>
                      <option value="none">No Filesystem Access</option>
                      <option value="all">Full System Filesystem</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METADATA & PORTS */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Node Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Namespaced ID</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  >
                    <option value="testing">Testing / Guard</option>
                    <option value="automation">Automation</option>
                    <option value="git">Git Extension</option>
                    <option value="notification">Notification</option>
                    <option value="devops">DevOps / CI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Author</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Input Port Type</label>
                  <select
                    value={inputPort}
                    onChange={(e) => setInputPort(e.target.value as PortDataType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  >
                    {PORT_TYPES.map((p) => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Output Port Type</label>
                  <select
                    value={outputPort}
                    onChange={(e) => setOutputPort(e.target.value as PortDataType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  >
                    {PORT_TYPES.map((p) => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEST RUNNER CONSOLE */}
          {activeTab === 'runner' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">Interactive Studio Test Runner</h3>
                  <p className="text-xs text-zinc-400">
                    Execute this node against the active workspace repository ({repoPath || 'default workspace'}).
                  </p>
                </div>
                <button
                  onClick={handleTestRun}
                  disabled={testStatus === 'running'}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-black hover:bg-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testStatus === 'running' ? 'Executing...' : 'Run Test Script'}
                </button>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2 min-h-[160px]">
                {testStatus === 'idle' && (
                  <div className="text-zinc-600 flex flex-col items-center justify-center py-8">
                    <Terminal className="w-6 h-6 mb-2 opacity-40" />
                    <span>Click &ldquo;Run Test Script&rdquo; to execute and inspect live terminal output.</span>
                  </div>
                )}

                {testStatus === 'running' && (
                  <div className="text-amber-400 flex items-center gap-2 py-4">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Running process in workspace...</span>
                  </div>
                )}

                {testLogs && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            testStatus === 'success'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {runtime === 'webhook'
                            ? `HTTP ${testLogs.status || 200}`
                            : `Exit Code ${testLogs.exitCode ?? 0}`}
                        </span>
                        <span className="text-zinc-400">{testStatus === 'success' ? 'Execution Passed' : 'Execution Failed'}</span>
                      </div>
                      {testLogs.durationMs !== undefined && (
                        <span className="text-zinc-500">{testLogs.durationMs}ms</span>
                      )}
                    </div>

                    {testLogs.stdout && (
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1">STDOUT:</span>
                        <pre className="text-zinc-300 whitespace-pre-wrap bg-zinc-900/50 p-2.5 rounded border border-zinc-900 max-h-48 overflow-y-auto">
                          {testLogs.stdout}
                        </pre>
                      </div>
                    )}

                    {testLogs.stderr && (
                      <div>
                        <span className="text-[10px] text-rose-400 block mb-1">STDERR:</span>
                        <pre className="text-rose-300 whitespace-pre-wrap bg-rose-950/20 p-2.5 rounded border border-rose-950/50 max-h-48 overflow-y-auto">
                          {testLogs.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MANIFEST JSON */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Save this JSON as <code className="text-zinc-300 font-mono">.branchwatch/nodes/{id}.json</code> to port it into external repos.
                </span>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1 rounded text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .json
                </button>
              </div>
              <pre className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-300 overflow-x-auto max-h-[340px]">
                {JSON.stringify(buildManifest(), null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-900 bg-zinc-900/30">
          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Schema JSON
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-black bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isSaved ? 'Saved to Palette!' : 'Save Custom Node'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
