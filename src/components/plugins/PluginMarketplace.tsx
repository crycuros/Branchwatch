import React, { useState, useEffect } from 'react';
import { PluginNodeDefinition, PluginCategory } from '@/lib/pluginTypes';
import {
  getAllAvailablePlugins,
  installPlugin,
  uninstallPlugin,
  deleteCustomPlugin,
} from '@/lib/pluginStorage';
import {
  Search, Plus, CheckCircle2, Download, Trash2, Edit3, Box,
  Archive, GitMerge, Tag, GitPullRequest, Settings2, Sparkles,
  ExternalLink, Layers, ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PluginEditorModal } from './PluginEditorModal';

interface PluginMarketplaceProps {
  onPluginsChanged?: () => void;
  onOpenEditor?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Archive,
  GitMerge,
  Tag,
  GitPullRequest,
  Settings2,
  Trash2,
};

export const PluginMarketplace: React.FC<PluginMarketplaceProps> = ({
  onPluginsChanged,
}) => {
  const [plugins, setPlugins] = useState<PluginNodeDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PluginCategory>('all');
  const [editingPlugin, setEditingPlugin] = useState<PluginNodeDefinition | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const loadPlugins = () => {
    const list = getAllAvailablePlugins();
    setPlugins(list);
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleToggleInstall = (plugin: PluginNodeDefinition) => {
    if (plugin.installed) {
      uninstallPlugin(plugin.id);
    } else {
      installPlugin(plugin.id);
    }
    loadPlugins();
    onPluginsChanged?.();
  };

  const handleDeleteCustom = (pluginId: string) => {
    deleteCustomPlugin(pluginId);
    loadPlugins();
    onPluginsChanged?.();
  };

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <Box className="w-5 h-5 stroke-[2.5]" />
            <span>Plugin & Node Registry</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              {plugins.length} Available
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Extend your visual Git canvas with community-authored nodes, custom automations, and release pipelines.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingPlugin(null);
            setIsEditorOpen(true);
          }}
          className="font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Node</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plugins by name, description, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 self-start sm:self-auto border border-neutral-200 dark:border-neutral-700 overflow-x-auto max-w-full">
          {(['all', 'git', 'automation', 'security', 'custom'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlugins.map((plugin) => {
          const Icon = ICON_MAP[plugin.iconName] || Settings2;
          return (
            <div
              key={plugin.id}
              className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-subtle flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {plugin.name}
                        </h3>
                        {plugin.isOfficial && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold uppercase">
                            Official
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400">
                        v{plugin.version} · by @{plugin.author.login}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    {plugin.category}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {plugin.description}
                </p>

                {/* Ports & Command Preview */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>Input: {plugin.inputPort.type}</span>
                    <span>Output: {plugin.outputPort.type}</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                    $ {plugin.commandTemplate}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                <div className="text-[10px] text-neutral-400 font-mono">
                  {plugin.configSchema.length} custom parameter{plugin.configSchema.length === 1 ? '' : 's'}
                </div>

                <div className="flex items-center gap-2">
                  {!plugin.isOfficial && (
                    <>
                      <button
                        onClick={() => {
                          setEditingPlugin(plugin);
                          setIsEditorOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Edit custom plugin schema"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustom(plugin.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete custom plugin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  <Button
                    variant={plugin.installed ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleInstall(plugin)}
                    className="text-xs font-semibold py-1"
                  >
                    {plugin.installed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Installed</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Install Node</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-neutral-400 text-xs">
          No plugins found matching &ldquo;{searchQuery}&rdquo;. Click &ldquo;Create Custom Node&rdquo; to build your own!
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <PluginEditorModal
          isOpen={isEditorOpen}
          initialPlugin={editingPlugin}
          onClose={() => setIsEditorOpen(false)}
          onPluginSaved={() => {
            loadPlugins();
            onPluginsChanged?.();
          }}
        />
      )}
    </div>
  );
};
