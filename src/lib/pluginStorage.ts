import { PluginNodeDefinition } from './pluginTypes';

export const OFFICIAL_STARTER_PLUGINS: PluginNodeDefinition[] = [
  {
    id: 'plugin-stash',
    name: 'Git Stash & Pop',
    version: '1.0.0',
    description: 'Temporarily shelve uncommitted working tree changes to switch branches cleanly and pop them back later.',
    author: {
      name: 'BranchWatch Core',
      login: 'branchwatch',
    },
    iconName: 'Archive',
    category: 'git',
    inputPort: {
      type: 'WorkingTreeChanges',
      label: 'Working Tree Changes',
    },
    outputPort: {
      type: 'WorkingTreeChanges',
      label: 'Stashed Working Tree',
    },
    configSchema: [
      {
        key: 'stashMessage',
        label: 'Stash Message',
        type: 'text',
        placeholder: 'WIP: temporary stash before switch',
        defaultValue: 'WIP: work in progress',
      },
      {
        key: 'includeUntracked',
        label: 'Include Untracked Files (-u)',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
    commandTemplate: 'git stash push -m "{{stashMessage}}"{{#if includeUntracked}} -u{{/if}}',
    isOfficial: true,
    installed: true,
    createdAt: '2026-09-01T00:00:00Z',
    downloadsCount: 1420,
    starsCount: 89,
  },
  {
    id: 'plugin-rebase-sync',
    name: 'Rebase Upstream Sync',
    version: '1.1.0',
    description: 'Replay your branch commits on top of the latest target branch to keep commit history clean and linear.',
    author: {
      name: 'BranchWatch Core',
      login: 'branchwatch',
    },
    iconName: 'GitMerge',
    category: 'git',
    inputPort: {
      type: 'BranchRef',
      label: 'Feature Branch',
    },
    outputPort: {
      type: 'BranchRef',
      label: 'Rebased Branch',
    },
    configSchema: [
      {
        key: 'upstreamBranch',
        label: 'Target Upstream Branch',
        type: 'text',
        placeholder: 'origin/main or main',
        defaultValue: 'main',
        required: true,
      },
      {
        key: 'autoStash',
        label: 'Auto-stash during rebase',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
    commandTemplate: 'git rebase {{#if autoStash}}--autostash {{/if}}{{upstreamBranch}}',
    isOfficial: true,
    installed: true,
    createdAt: '2026-09-02T00:00:00Z',
    downloadsCount: 980,
    starsCount: 76,
  },
  {
    id: 'plugin-semver-tag',
    name: 'SemVer Release Tagger',
    version: '1.0.2',
    description: 'Create signed or annotated Git semantic release tags (e.g. v1.2.0) and push them directly to remote.',
    author: {
      name: 'Alex Rivera',
      login: 'alex_dev',
    },
    iconName: 'Tag',
    category: 'automation',
    inputPort: {
      type: 'CommitRef',
      label: 'Release Commit',
    },
    outputPort: {
      type: 'RemoteRef',
      label: 'Tagged Release',
    },
    configSchema: [
      {
        key: 'versionTag',
        label: 'Version Tag',
        type: 'text',
        placeholder: 'e.g. v1.0.0',
        defaultValue: 'v1.0.0',
        required: true,
      },
      {
        key: 'tagMessage',
        label: 'Release Notes / Message',
        type: 'textarea',
        placeholder: 'Production release notes...',
        defaultValue: 'Production release',
      },
    ],
    commandTemplate: 'git tag -a {{versionTag}} -m "{{tagMessage}}" && git push origin {{versionTag}}',
    isOfficial: false,
    installed: false,
    createdAt: '2026-09-10T00:00:00Z',
    downloadsCount: 650,
    starsCount: 42,
  },
  {
    id: 'plugin-clean-branches',
    name: 'Prune Merged Branches',
    version: '1.0.0',
    description: 'Safely sweep and delete all local branches that have already been merged into main.',
    author: {
      name: 'Sarah Chen',
      login: 'sarah_dev',
    },
    iconName: 'Trash2',
    category: 'git',
    inputPort: {
      type: 'BranchRef',
      label: 'Target Branch',
    },
    outputPort: {
      type: 'BranchRef',
      label: 'Cleaned Workspace',
    },
    configSchema: [
      {
        key: 'baseBranch',
        label: 'Base Branch to compare against',
        type: 'text',
        placeholder: 'main',
        defaultValue: 'main',
      },
    ],
    commandTemplate: 'git branch --merged {{baseBranch}} | grep -v "{{baseBranch}}" | xargs git branch -d',
    isOfficial: false,
    installed: false,
    createdAt: '2026-09-14T00:00:00Z',
    downloadsCount: 430,
    starsCount: 31,
  },
  {
    id: 'plugin-github-pr',
    name: 'GitHub Pull Request',
    version: '1.2.0',
    description: 'Create an official GitHub Pull Request for your active branch directly from the visual canvas.',
    author: {
      name: 'BranchWatch Core',
      login: 'branchwatch',
    },
    iconName: 'GitPullRequest',
    category: 'automation',
    inputPort: {
      type: 'BranchRef',
      label: 'Source Branch',
    },
    outputPort: {
      type: 'RemoteRef',
      label: 'Opened PR',
    },
    configSchema: [
      {
        key: 'prTitle',
        label: 'PR Title',
        type: 'text',
        placeholder: 'feat: implement interactive plugins',
        defaultValue: 'feat: updates',
        required: true,
      },
      {
        key: 'baseBranch',
        label: 'Base Branch (Target)',
        type: 'text',
        placeholder: 'main',
        defaultValue: 'main',
        required: true,
      },
      {
        key: 'isDraft',
        label: 'Create as Draft PR',
        type: 'checkbox',
        defaultValue: false,
      },
    ],
    commandTemplate: 'gh pr create --title "{{prTitle}}" --base {{baseBranch}}{{#if isDraft}} --draft{{/if}}',
    isOfficial: true,
    installed: true,
    createdAt: '2026-09-15T00:00:00Z',
    downloadsCount: 1890,
    starsCount: 114,
  },
];

const STORAGE_KEY_INSTALLED = 'branchwatch_installed_plugin_ids';
const STORAGE_KEY_CUSTOM = 'branchwatch_custom_plugins';

export function getInstalledPluginIds(): string[] {
  if (typeof window === 'undefined') {
    return OFFICIAL_STARTER_PLUGINS.filter((p) => p.installed).map((p) => p.id);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSTALLED);
    if (!raw) {
      const defaultIds = OFFICIAL_STARTER_PLUGINS.filter((p) => p.installed).map((p) => p.id);
      localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(defaultIds));
      return defaultIds;
    }
    return JSON.parse(raw);
  } catch {
    return OFFICIAL_STARTER_PLUGINS.filter((p) => p.installed).map((p) => p.id);
  }
}

export function getCustomPlugins(): PluginNodeDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAllAvailablePlugins(): PluginNodeDefinition[] {
  const custom = getCustomPlugins();
  const installedIds = new Set(getInstalledPluginIds());

  const all = [...OFFICIAL_STARTER_PLUGINS, ...custom];
  return all.map((p) => ({
    ...p,
    installed: installedIds.has(p.id),
  }));
}

export function getInstalledPlugins(): PluginNodeDefinition[] {
  const all = getAllAvailablePlugins();
  return all.filter((p) => p.installed);
}

export function installPlugin(pluginId: string): void {
  const current = new Set(getInstalledPluginIds());
  current.add(pluginId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(Array.from(current)));
  }
}

export function uninstallPlugin(pluginId: string): void {
  const current = new Set(getInstalledPluginIds());
  current.delete(pluginId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(Array.from(current)));
  }
}

export function saveCustomPlugin(plugin: PluginNodeDefinition): void {
  if (typeof window === 'undefined') return;
  const custom = getCustomPlugins();
  const index = custom.findIndex((p) => p.id === plugin.id);
  if (index >= 0) {
    custom[index] = plugin;
  } else {
    custom.unshift(plugin);
  }
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(custom));
  installPlugin(plugin.id);
}

export function deleteCustomPlugin(pluginId: string): void {
  if (typeof window === 'undefined') return;
  const custom = getCustomPlugins().filter((p) => p.id !== pluginId);
  localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(custom));
  uninstallPlugin(pluginId);
}
