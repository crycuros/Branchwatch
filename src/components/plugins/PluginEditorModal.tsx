import React, { useState, useMemo } from 'react';
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
  AlertCircle,
  Copy,
  Check,
  HardDrive,
  Cpu,
  ExternalLink,
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
  { name: 'Shield', Icon: Shield, label: 'Testing / Guard' },
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
  const [activeTab, setActiveTab] = useState<'code' | 'permissions' | 'metadata' | 'runner' | 'json'>('code');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Context & Environment Simulator State
  const [simBranch, setSimBranch] = useState(currentBranch || 'feature/login-module');
  const [simAhead, setSimAhead] = useState('2');
  const [simBehind, setSimBehind] = useState('0');
  const [simCommittedFiles, setSimCommittedFiles] = useState('src/auth.ts,src/api/auth.ts');

  // PR Submitter State
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [copiedPrJson, setCopiedPrJson] = useState(false);

  // Test Runner State
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [testLogs, setTestLogs] = useState<{ stdout: string; stderr: string; exitCode?: number; status?: number; durationMs?: number } | null>(null);

  const codeLineCount = useMemo(() => {
    return (commandTemplate || '').split('\n').length;
  }, [commandTemplate]);

  if (!isOpen) return null;

  const handleAddField = () => {
    const newKey = `param_${Date.now().toString().slice(-4)}`;
    setConfigFields((prev) => [
      ...prev,
      {
        key: newKey,
        label: `Parameter ${prev.length + 1}`,
        type: 'text',
        defaultValue: '',
        description: 'Configure runtime parameter',
        required: false,
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
    setCommandTemplate((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + token);
  };

  const handleTestRun = async () => {
    setTestStatus('running');
    setTestLogs(null);
    try {
      const response = await fetch('/api/workflow/run-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: repoPath || '',
          runtime,
          commandTemplate: runtime !== 'webhook' ? commandTemplate : undefined,
          webhookConfig:
            runtime === 'webhook'
              ? {
                  url: webhookUrl,
                  method: webhookMethod,
                  bodyTemplate: webhookBody,
                }
              : undefined,
          context: {
            BW_CURRENT_BRANCH: simBranch || 'main',
            BW_REPO_PATH: repoPath || process.cwd?.() || '',
            BW_COMMITTED_FILES: simCommittedFiles || '',
            BW_AHEAD_COUNT: simAhead || '0',
            BW_BEHIND_COUNT: simBehind || '0',
          },
        }),
      });
      const data = await response.json();
      setTestLogs(data);
      if (data.exitCode === 0 || (data.status && data.status >= 200 && data.status < 400)) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestLogs({
        stdout: '',
        stderr: err?.message || 'Failed to connect to backend execution runner.',
        exitCode: 1,
      });
    }
  };

  const buildManifest = (): PluginNodeDefinition => {
    return {
      schemaVersion: 1,
      id,
      name,
      version,
      description,
      author: {
        name: authorName,
        login: authorName.toLowerCase().replace(/\s+/g, ''),
      },
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
      commandTemplate: runtime !== 'webhook' ? commandTemplate : undefined,
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

  const handleCopyJson = () => {
    const manifest = buildManifest();
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
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

  const getRuntimeFileName = () => {
    switch (runtime) {
      case 'nodejs':
        return 'handler.js';
      case 'python':
        return 'script.py';
      case 'webhook':
        return 'payload.json';
      case 'shell':
      default:
        return 'command.sh';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-5xl h-[88vh] max-h-[820px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 1. Studio Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">Script & Node Studio</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                  Schema v1
                </span>
                <span className="text-xs font-mono text-zinc-500">· {id}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Author custom CLI commands, webhook integrations, and portable node extensions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Runtime Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
              {(['shell', 'nodejs', 'python', 'webhook'] as PluginRuntime[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRuntime(r)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors capitalize ${
                    runtime === r
                      ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {r === 'nodejs' ? 'Node.js' : r}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Subheader Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-zinc-900 bg-zinc-950 text-xs select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'border-zinc-200 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Script & Code</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'border-zinc-200 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Permissions</span>
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'metadata'
                  ? 'border-zinc-200 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Metadata & Ports</span>
            </button>
            <button
              onClick={() => setActiveTab('runner')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'runner'
                  ? 'border-zinc-200 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Test Sandbox</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'border-zinc-200 text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Manifest JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('runner');
                handleTestRun();
              }}
              className="text-xs h-7 px-2.5"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Test Run</span>
            </Button>
          </div>
        </div>

        {/* 3. Studio Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* TAB 1: SCRIPT & CODE */}
          {activeTab === 'code' && (
            <div className="h-full flex flex-col space-y-3 min-h-[380px]">
              {runtime === 'webhook' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">HTTP Method</label>
                      <select
                        value={webhookMethod}
                        onChange={(e) => setWebhookMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">Endpoint URL</label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/... or http://localhost:8080/events"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col space-y-2">
                    <label className="text-xs font-medium text-zinc-300">
                      Payload Body (JSON Template)
                    </label>
                    <textarea
                      rows={10}
                      value={webhookBody}
                      onChange={(e) => setWebhookBody(e.target.value)}
                      className="w-full p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 leading-relaxed focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-3">
                  {/* Editor Container */}
                  <div className="flex-1 flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden min-h-[340px]">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                          <FileCode className="w-3 h-3 text-zinc-400" />
                          <span>{getRuntimeFileName()}</span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">{codeLineCount} lines</span>
                      </div>

                      {/* Injected Context Quick Chips */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono mr-1">Inject:</span>
                        <button
                          onClick={() => handleInsertToken('{{BW_CURRENT_BRANCH}}')}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                          title="Insert Current Branch context"
                        >
                          {'{{BRANCH}}'}
                        </button>
                        <button
                          onClick={() => handleInsertToken('{{BW_REPO_PATH}}')}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                          title="Insert Workspace Path context"
                        >
                          {'{{REPO}}'}
                        </button>
                        <button
                          onClick={() => handleInsertToken('{{BW_COMMITTED_FILES}}')}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                          title="Insert Staged/Committed files list"
                        >
                          {'{{FILES}}'}
                        </button>
                        <button
                          onClick={() => handleInsertToken('{{BW_AHEAD_COUNT}}')}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700/60 transition-colors"
                          title="Insert Divergence Count context"
                        >
                          {'{{AHEAD}}'}
                        </button>
                      </div>
                    </div>

                    {/* Editor Surface with Line Numbers */}
                    <div className="flex-1 flex overflow-hidden bg-zinc-950 font-mono text-xs">
                      {/* Line Number Gutter */}
                      <div className="w-10 py-3 bg-zinc-950/90 border-r border-zinc-900 text-zinc-600 select-none text-right pr-2.5 font-mono text-[11px] leading-[20px]">
                        {Array.from({ length: Math.max(codeLineCount, 12) }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Textarea */}
                      <textarea
                        value={commandTemplate}
                        onChange={(e) => setCommandTemplate(e.target.value)}
                        placeholder={
                          runtime === 'shell'
                            ? '# Write CLI shell commands (e.g. npm test && git status)'
                            : runtime === 'nodejs'
                            ? '// Write Node.js script (access process.env.BW_CURRENT_BRANCH)'
                            : '# Write Python script (access os.environ.get("BW_CURRENT_BRANCH"))'
                        }
                        className="flex-1 p-3 bg-transparent text-zinc-100 font-mono text-xs leading-[20px] resize-none focus:outline-none placeholder:text-zinc-600"
                        spellCheck={false}
                      />
                    </div>

                    {/* Editor Status Bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border-t border-zinc-900 text-[10px] font-mono text-zinc-500">
                      <div className="flex items-center gap-3">
                        <span>Runtime: {runtime}</span>
                        <span>Encoding: UTF-8</span>
                      </div>
                      <div>Injected: BW_REPO_PATH, BW_CURRENT_BRANCH, BW_COMMITTED_FILES</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-900">
                <h3 className="text-xs font-semibold text-zinc-100">Execution Permission Matrix</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Declare the exact system capabilities this node requires. Users will review and approve these permissions before first execution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Shell Execution */}
                <div
                  onClick={() => setPermissions({ ...permissions, shell: !permissions.shell })}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                    permissions.shell
                      ? 'border-zinc-700 bg-zinc-900/90'
                      : 'border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-900/30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                      permissions.shell
                        ? 'bg-zinc-100 border-zinc-100 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900/80 hover:border-zinc-500'
                    }`}
                  >
                    {permissions.shell && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Shell Execution</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Spawns local sub-processes (PowerShell, sh, npm, docker).
                    </div>
                  </div>
                </div>

                {/* Network & Webhooks */}
                <div
                  onClick={() => setPermissions({ ...permissions, network: !permissions.network })}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                    permissions.network
                      ? 'border-zinc-700 bg-zinc-900/90'
                      : 'border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-900/30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                      permissions.network
                        ? 'bg-zinc-100 border-zinc-100 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900/80 hover:border-zinc-500'
                    }`}
                  >
                    {permissions.network && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span>Network & Webhooks</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Allows outbound HTTP requests to remote APIs and services.
                    </div>
                  </div>
                </div>

                {/* Git Workspace Access */}
                <div
                  onClick={() => setPermissions({ ...permissions, git: !permissions.git })}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                    permissions.git
                      ? 'border-zinc-700 bg-zinc-900/90'
                      : 'border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-900/30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                      permissions.git
                        ? 'bg-zinc-100 border-zinc-100 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900/80 hover:border-zinc-500'
                    }`}
                  >
                    {permissions.git && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Git Workspace Access</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Reads and modifies local Git branches, refs, and diffs.
                    </div>
                  </div>
                </div>

                {/* Filesystem Scope */}
                <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 flex items-start gap-3">
                  <div className="w-full">
                    <div className="text-xs font-medium text-zinc-100 mb-1.5 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Filesystem Scope</span>
                    </div>
                    <select
                      value={permissions.filesystem || 'workspace'}
                      onChange={(e) => setPermissions({ ...permissions, filesystem: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
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
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Namespaced ID</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="testing">Testing / Quality</option>
                    <option value="automation">Automation</option>
                    <option value="git">Git Extension</option>
                    <option value="notification">Notification</option>
                    <option value="devops">DevOps / Release</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Author</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Port Configuration */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-900">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Input Port Type</label>
                  <select
                    value={inputPort}
                    onChange={(e) => setInputPort(e.target.value as PortDataType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
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
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    {PORT_TYPES.map((p) => (
                      <option key={p.type} value={p.type}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEST RUNNER CONSOLE & CONTEXT SIMULATOR */}
          {activeTab === 'runner' && (
            <div className="space-y-4">
              {/* Context & Environment Simulator */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-200">Context & Environment Simulator</span>
                  </div>
                  {/* Presets */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500 font-mono mr-1">Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSimBranch('feature/login-jwt');
                        setSimAhead('3');
                        setSimBehind('0');
                        setSimCommittedFiles('src/auth.ts,src/index.ts');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
                    >
                      Feature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimBranch('release/v2.1.0');
                        setSimAhead('8');
                        setSimBehind('0');
                        setSimCommittedFiles('package.json,CHANGELOG.md');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
                    >
                      Release
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimBranch('hotfix/db-leak');
                        setSimAhead('1');
                        setSimBehind('4');
                        setSimCommittedFiles('prisma/schema.prisma');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
                    >
                      Hotfix
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimBranch('main');
                        setSimAhead('0');
                        setSimBehind('0');
                        setSimCommittedFiles('');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
                    >
                      Main
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">BW_CURRENT_BRANCH</label>
                    <input
                      type="text"
                      value={simBranch}
                      onChange={(e) => setSimBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">BW_COMMITTED_FILES</label>
                    <input
                      type="text"
                      value={simCommittedFiles}
                      onChange={(e) => setSimCommittedFiles(e.target.value)}
                      placeholder="e.g. src/auth.ts,prisma/schema.prisma"
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-1">BW_AHEAD</label>
                      <input
                        type="number"
                        value={simAhead}
                        onChange={(e) => setSimAhead(e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-1">BW_BEHIND</label>
                      <input
                        type="number"
                        value={simBehind}
                        onChange={(e) => setSimBehind(e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sandbox Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Live Workspace Execution Sandbox</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Execute against active workspace ({repoPath || 'default workspace'}) with simulated environment variables.
                  </p>
                </div>
                <button
                  onClick={handleTestRun}
                  disabled={testStatus === 'running'}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{testStatus === 'running' ? 'Executing...' : 'Run Test'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-3 min-h-[180px]">
                {testStatus === 'idle' && (
                  <div className="text-zinc-600 flex flex-col items-center justify-center py-8">
                    <Terminal className="w-8 h-8 mb-2 opacity-30" />
                    <span>Click &ldquo;Run Test&rdquo; to execute and inspect live simulated output.</span>
                  </div>
                )}

                {testStatus === 'running' && (
                  <div className="text-amber-400 flex items-center gap-2.5 py-6">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Executing script with simulated context...</span>
                  </div>
                )}

                {testLogs && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-xs">
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
                        <span className="text-zinc-300 font-medium">
                          {testStatus === 'success' ? 'Execution Passed' : 'Execution Failed'}
                        </span>
                      </div>
                      {testLogs.durationMs !== undefined && (
                        <span className="text-zinc-500">{testLogs.durationMs}ms</span>
                      )}
                    </div>

                    {testLogs.stdout && (
                      <div>
                        <span className="text-[10px] text-zinc-500 block mb-1">STDOUT:</span>
                        <pre className="text-zinc-200 whitespace-pre-wrap bg-zinc-900/60 p-3 rounded-lg border border-zinc-900 max-h-48 overflow-y-auto">
                          {testLogs.stdout}
                        </pre>
                      </div>
                    )}

                    {testLogs.stderr && (
                      <div>
                        <span className="text-[10px] text-rose-400 block mb-1">STDERR:</span>
                        <pre className="text-rose-300 whitespace-pre-wrap bg-rose-950/20 p-3 rounded-lg border border-rose-950/50 max-h-48 overflow-y-auto">
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
                  Save this JSON as <code className="text-zinc-300 font-mono">.branchwatch/nodes/{id}.json</code> to port into any repo.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1 rounded-lg text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1 rounded-lg text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-300 overflow-x-auto max-h-[340px]">
                {JSON.stringify(buildManifest(), null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 4. Studio Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-900 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Schema JSON</span>
            </button>
            <button
              onClick={() => setIsPrModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
              <span>Submit to Community PR</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved to Palette!' : 'Save Node'}</span>
            </button>
          </div>
        </div>

        {/* Community PR Modal Dialog */}
        {isPrModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <GitPullRequest className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">Submit Node to Official Registry</h3>
                </div>
                <button
                  onClick={() => setIsPrModalOpen(false)}
                  className="p-1 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                BranchWatch is an open-source platform. You can contribute your custom node to the community registry by submitting a PR to <code className="text-zinc-200 font-mono">crycuros/Branchwatch</code>.
              </p>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs space-y-1.5 font-mono">
                <div className="text-zinc-500">Target File Path:</div>
                <div className="text-zinc-200 font-bold">.branchwatch/registry/nodes/{id}.json</div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(buildManifest(), null, 2));
                    setCopiedPrJson(true);
                    setTimeout(() => setCopiedPrJson(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5"
                >
                  {copiedPrJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrJson ? 'Manifest Copied!' : 'Copy PR Manifest'}</span>
                </button>

                <a
                  href={`https://github.com/crycuros/Branchwatch/issues/new?title=[Node+Submission]+${encodeURIComponent(name)}&body=${encodeURIComponent(
                    `### Custom Node Submission\n\n**Node ID:** \`${id}\`\n**Runtime:** \`${runtime}\`\n**Author:** @${authorName}\n\n\`\`\`json\n${JSON.stringify(
                      buildManifest(),
                      null,
                      2
                    )}\n\`\`\``
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white inline-flex items-center gap-1.5"
                >
                  <span>Open GitHub Submission</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
