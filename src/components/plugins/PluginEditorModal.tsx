import React, { useState } from 'react';
import { PluginNodeDefinition, PluginCategory, ConfigFieldSchema, ConfigFieldType } from '@/lib/pluginTypes';
import { PortDataType } from '@/lib/workflowTypes';
import { saveCustomPlugin } from '@/lib/pluginStorage';
import {
  X, Plus, Trash2, Code2, Sparkles, CheckCircle2, Box,
  GitBranch, GitCommit, FileCode, FolderGit2, Download, Upload,
  Archive, GitMerge, Tag, GitPullRequest, Layers, Play, Settings2,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PluginEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPluginSaved: (plugin: PluginNodeDefinition) => void;
  initialPlugin?: PluginNodeDefinition | null;
}

const AVAILABLE_ICONS = [
  { name: 'Archive', Icon: Archive, label: 'Archive/Stash' },
  { name: 'GitMerge', Icon: GitMerge, label: 'Merge/Rebase' },
  { name: 'Tag', Icon: Tag, label: 'Tag/Release' },
  { name: 'GitPullRequest', Icon: GitPullRequest, label: 'Pull Request' },
  { name: 'GitBranch', Icon: GitBranch, label: 'Branch' },
  { name: 'GitCommit', Icon: GitCommit, label: 'Commit' },
  { name: 'FileCode', Icon: FileCode, label: 'File Code' },
  { name: 'FolderGit2', Icon: FolderGit2, label: 'Folder' },
  { name: 'Trash2', Icon: Trash2, label: 'Prune/Trash' },
  { name: 'Settings2', Icon: Settings2, label: 'Settings' },
];

const PORT_TYPES: { type: PortDataType; label: string }[] = [
  { type: 'WorkingTreeChanges', label: 'WorkingTree Changes' },
  { type: 'StagedChanges', label: 'Staged Changes' },
  { type: 'CommitRef', label: 'Commit Reference' },
  { type: 'BranchRef', label: 'Branch Reference' },
  { type: 'RemoteRef', label: 'Remote Reference' },
  { type: 'None', label: 'None (Terminal/Source)' },
];

export const PluginEditorModal: React.FC<PluginEditorModalProps> = ({
  isOpen,
  onClose,
  onPluginSaved,
  initialPlugin,
}) => {
  const [name, setName] = useState(initialPlugin?.name || 'My Custom Node');
  const [description, setDescription] = useState(
    initialPlugin?.description || 'A custom Git workflow action created for BranchWatch.'
  );
  const [category, setCategory] = useState<PluginCategory>(initialPlugin?.category || 'git');
  const [iconName, setIconName] = useState(initialPlugin?.iconName || 'Settings2');
  const [authorName, setAuthorName] = useState(initialPlugin?.author.name || 'Developer');
  const [authorLogin, setAuthorLogin] = useState(initialPlugin?.author.login || 'dev');
  const [version, setVersion] = useState(initialPlugin?.version || '1.0.0');

  const [inputPort, setInputPort] = useState<PortDataType>(initialPlugin?.inputPort.type || 'BranchRef');
  const [outputPort, setOutputPort] = useState<PortDataType>(initialPlugin?.outputPort.type || 'BranchRef');

  const [commandTemplate, setCommandTemplate] = useState(
    initialPlugin?.commandTemplate || 'git {{action}} {{targetBranch}}'
  );

  const [configFields, setConfigFields] = useState<ConfigFieldSchema[]>(
    initialPlugin?.configSchema || [
      {
        key: 'targetBranch',
        label: 'Target Branch',
        type: 'text',
        placeholder: 'e.g. main',
        defaultValue: 'main',
        required: true,
      },
    ]
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'json' | 'preview'>('editor');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleAddField = () => {
    const newKey = `field_${Date.now().toString().slice(-4)}`;
    setConfigFields((prev) => [
      ...prev,
      {
        key: newKey,
        label: 'New Parameter',
        type: 'text',
        placeholder: 'Enter value...',
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

  const handleInsertTag = (tagKey: string) => {
    setCommandTemplate((prev) => `${prev} {{${tagKey}}}`);
  };

  const handleSave = () => {
    const slug = initialPlugin?.id || `plugin-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const plugin: PluginNodeDefinition = {
      id: slug,
      name: name.trim() || 'Custom Node',
      version: version.trim() || '1.0.0',
      description: description.trim(),
      author: {
        name: authorName.trim() || 'Developer',
        login: authorLogin.trim() || 'dev',
      },
      iconName,
      category,
      inputPort: {
        type: inputPort,
        label: PORT_TYPES.find((p) => p.type === inputPort)?.label || inputPort,
      },
      outputPort: {
        type: outputPort,
        label: PORT_TYPES.find((p) => p.type === outputPort)?.label || outputPort,
      },
      configSchema: configFields,
      commandTemplate: commandTemplate.trim(),
      isOfficial: false,
      installed: true,
      createdAt: initialPlugin?.createdAt || new Date().toISOString(),
      downloadsCount: initialPlugin?.downloadsCount || 1,
      starsCount: initialPlugin?.starsCount || 0,
    };

    saveCustomPlugin(plugin);
    setIsSaved(true);
    setTimeout(() => {
      onPluginSaved(plugin);
      onClose();
    }, 800);
  };

  const IconComponent = AVAILABLE_ICONS.find((i) => i.name === iconName)?.Icon || Settings2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0d0e12] border border-neutral-800 text-neutral-100 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Node & Plugin Studio</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Extensible Engine
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Author custom Git nodes and automation plugins for BranchWatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Pills */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  activeTab === 'editor' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Visual Editor
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  activeTab === 'json' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Schema JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'editor' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Properties & Wiring */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Basic Metadata */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Node Metadata</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">Node Title</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        placeholder="e.g. Git LFS Pull"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as PluginCategory)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400"
                      >
                        <option value="git">Git Core & Branching</option>
                        <option value="automation">Automation & Release</option>
                        <option value="notification">Notifications</option>
                        <option value="security">Security & Checks</option>
                        <option value="custom">Custom Utility</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                      placeholder="What does this custom node do?"
                    />
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Node Icon</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {AVAILABLE_ICONS.map(({ name: iName, Icon: Ico }) => (
                        <button
                          key={iName}
                          type="button"
                          onClick={() => setIconName(iName)}
                          className={`p-2 rounded-lg border transition-all ${
                            iconName === iName
                              ? 'bg-white text-neutral-950 border-white shadow-sm'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                          title={iName}
                        >
                          <Ico className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Port Wiring */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Port Data Types (Connectivity)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">Input Port (Consumes)</label>
                      <select
                        value={inputPort}
                        onChange={(e) => setInputPort(e.target.value as PortDataType)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
                      >
                        {PORT_TYPES.map((p) => (
                          <option key={p.type} value={p.type}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">Output Port (Produces)</label>
                      <select
                        value={outputPort}
                        onChange={(e) => setOutputPort(e.target.value as PortDataType)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-neutral-400"
                      >
                        {PORT_TYPES.map((p) => (
                          <option key={p.type} value={p.type}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Parameters Schema */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Node Configuration Parameters</span>
                    </h3>
                    <Button variant="outline" size="sm" onClick={handleAddField} className="text-xs py-1">
                      <Plus className="w-3 h-3" />
                      <span>Add Parameter</span>
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {configFields.map((field, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Variable key (e.g. branchName)"
                            value={field.key}
                            onChange={(e) => handleUpdateField(idx, { key: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200"
                          />
                          <input
                            type="text"
                            placeholder="Label (e.g. Target Branch)"
                            value={field.label}
                            onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(idx, { type: e.target.value as ConfigFieldType })}
                            className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300"
                          >
                            <option value="text">Text Input</option>
                            <option value="textarea">Textarea</option>
                            <option value="checkbox">Toggle/Checkbox</option>
                            <option value="number">Number</option>
                          </select>
                          <button
                            onClick={() => handleRemoveField(idx)}
                            className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Default value"
                            value={field.defaultValue ?? ''}
                            onChange={(e) => handleUpdateField(idx, { defaultValue: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800/60 text-[10px] font-mono text-neutral-400"
                          />
                          <input
                            type="text"
                            placeholder="Placeholder hint"
                            value={field.placeholder ?? ''}
                            onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800/60 text-[10px] text-neutral-400"
                          />
                        </div>
                      </div>
                    ))}
                    {configFields.length === 0 && (
                      <div className="text-center py-4 text-xs text-neutral-500">
                        No parameters defined. Click &ldquo;Add Parameter&rdquo; to configure inspector fields.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Command Template */}
                <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Git Execution Template</span>
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <span>Insert tag:</span>
                      {configFields.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => handleInsertTag(f.key)}
                          className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono"
                        >
                          +{f.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={commandTemplate}
                    onChange={(e) => setCommandTemplate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                    placeholder="e.g. git stash push -m &quot;{{message}}&quot;"
                  />
                  <div className="text-[10px] font-mono text-neutral-500">
                    Template variables are replaced dynamically with values from the Node Inspector.
                  </div>
                </div>

              </div>

              {/* Right Column: Live Node Card Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-0 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    <span>Live Canvas Preview</span>
                  </h3>

                  {/* Mock Node Card */}
                  <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#111216] shadow-apple-dark overflow-hidden select-none">
                    {/* Top Header */}
                    <div className="flex items-center justify-between p-3.5 border-b border-neutral-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white tracking-tight">{name || 'Node Title'}</span>
                          <span className="block text-[9px] font-mono text-neutral-500">v{version} · {category}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        Plugin
                      </span>
                    </div>

                    {/* Port strip */}
                    <div className="flex justify-between items-center px-3.5 py-1 bg-neutral-900/60 border-b border-neutral-800/60 text-[9px] font-mono text-neutral-400">
                      <span>← {inputPort}</span>
                      <span>{outputPort} →</span>
                    </div>

                    {/* Body */}
                    <div className="p-3.5 space-y-2.5 text-xs">
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        {description || 'No description provided.'}
                      </p>

                      {configFields.map((f, i) => (
                        <div key={i} className="space-y-1">
                          <label className="block text-[10px] font-medium text-neutral-500">{f.label}</label>
                          <div className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300">
                            {f.defaultValue || f.placeholder || '(Empty)'}
                          </div>
                        </div>
                      ))}

                      <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80 font-mono text-[10px] text-emerald-400 truncate">
                        $ {commandTemplate}
                      </div>

                      <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                        Execute Plugin
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                    <div className="font-bold text-neutral-300">Author</div>
                    <div>@{authorLogin} ({authorName})</div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* JSON Export / Preview Tab */
            <div className="space-y-3">
              <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto max-h-[60vh]">
                {JSON.stringify(
                  {
                    id: initialPlugin?.id || `plugin-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    name,
                    version,
                    description,
                    author: { name: authorName, login: authorLogin },
                    iconName,
                    category,
                    inputPort: { type: inputPort, label: inputPort },
                    outputPort: { type: outputPort, label: outputPort },
                    configSchema: configFields,
                    commandTemplate,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/60 flex-shrink-0">
          <div className="text-xs text-neutral-500 font-mono">
            {isSaved ? '✓ Saved & Installed to Library!' : 'Changes are stored locally in your browser registry'}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="font-semibold"
              disabled={isSaved}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Installed!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Install to Node Library</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
