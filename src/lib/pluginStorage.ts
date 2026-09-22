import { PluginNodeDefinition } from './pluginTypes';

export const OFFICIAL_STARTER_PLUGINS: PluginNodeDefinition[] = [
  {
    schemaVersion: 1,
    id: 'plugin-stash',
    name: 'Git Stash & Pop',
    version: '1.0.0',
    description: 'Temporarily shelve uncommitted working tree changes to switch branches cleanly and pop them back later.',
    author: {
      name: 'BranchWatch Core',
      login: 'branchwatch',
    },
    homepage: 'https://git-scm.com/docs/git-stash',
    tags: ['git', 'stash', 'utility'],
    platforms: ['windows', 'linux', 'darwin'],
    iconName: 'Archive',
    category: 'git',
    runtime: 'shell',
    permissions: {
      filesystem: 'workspace',
      git: true,
      shell: true,
      network: false,
    },
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
    inputs: {
      message: '{{stashMessage}}',
    },
    outputs: {
      exitCode: '$EXIT_CODE',
      stdout: '$STDOUT',
    },
    source: 'community',
    isOfficial: true,
    installed: true,
    createdAt: '2026-09-01T00:00:00Z',
    downloadsCount: 1420,
    starsCount: 89,
  },
  {
    schemaVersion: 1,
    id: 'plugin-rebase-sync',
    name: 'Rebase Upstream Sync',
    version: '1.1.0',
    description: 'Replay your branch commits on top of the latest target branch to keep commit history clean and linear.',
    author: {
      name: 'BranchWatch Core',
      login: 'branchwatch',
    },
    tags: ['git', 'rebase', 'sync'],
    platforms: ['windows', 'linux', 'darwin'],
    iconName: 'GitMerge',
    category: 'git',
    runtime: 'shell',
    permissions: {
      filesystem: 'workspace',
      git: true,
      shell: true,
      network: false,
    },
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
    source: 'community',
    isOfficial: true,
    installed: true,
    createdAt: '2026-09-02T00:00:00Z',
    downloadsCount: 980,
    starsCount: 76,
  },
  {
    schemaVersion: 1,
    id: 'plugin-npm-test',
    name: 'NPM Test & Typecheck Runner',
    version: '1.2.0',
    description: 'Execute npm test suite and TypeScript compiler checks before allowing code to be pushed.',
    author: {
      name: 'DevOps Community',
      login: 'devops_ninja',
    },
    tags: ['testing', 'nodejs', 'npm', 'ci'],
    platforms: ['windows', 'linux', 'darwin'],
    iconName: 'ShieldCheck',
    category: 'testing',
    runtime: 'shell',
    permissions: {
      filesystem: 'workspace',
      shell: true,
      network: false,
      git: false,
    },
    inputPort: {
      type: 'CommitRef',
      label: 'Committed Code',
    },
    outputPort: {
      type: 'BranchRef',
      label: 'Verified Code',
    },
    configSchema: [
      {
        key: 'command',
        label: 'Test Command',
        type: 'text',
        defaultValue: 'npm test',
        placeholder: 'npm test or pnpm test',
        required: true,
      },
    ],
    commandTemplate: '{{command}}',
    inputs: {
      branch: '{{BRANCH}}',
    },
    outputs: {
      exitCode: '$EXIT_CODE',
      stdout: '$STDOUT',
    },
    onFailure: 'halt',
    source: 'community',
    isOfficial: true,
    installed: true,
    createdAt: '2026-09-05T00:00:00Z',
    downloadsCount: 2310,
    starsCount: 142,
  },
  {
    schemaVersion: 1,
    id: 'plugin-webhook-alert',
    name: 'HTTP Webhook Dispatcher',
    version: '1.0.0',
    description: 'Send real-time JSON webhooks to Slack, Discord, or CI/CD servers upon branch workflow completion.',
    author: {
      name: 'Integration Guild',
      login: 'integrations',
    },
    tags: ['webhook', 'slack', 'notification', 'http'],
    platforms: ['windows', 'linux', 'darwin'],
    iconName: 'Globe',
    category: 'notification',
    runtime: 'webhook',
    permissions: {
      network: true,
      filesystem: 'none',
      shell: false,
      git: false,
    },
    inputPort: {
      type: 'BranchRef',
      label: 'Branch Ref',
    },
    outputPort: {
      type: 'RemoteRef',
      label: 'Alert Sent',
    },
    configSchema: [
      {
        key: 'webhookUrl',
        label: 'Webhook Endpoint URL',
        type: 'text',
        placeholder: 'https://hooks.slack.com/services/... or http://localhost:8080/events',
        required: true,
      },
    ],
    webhookConfig: {
      url: '{{webhookUrl}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      bodyTemplate: '{"text": "BranchWatch workflow executed for branch {{BRANCH}} with {{AHEAD}} commits ahead."}',
    },
    source: 'community',
    isOfficial: true,
    installed: false,
    createdAt: '2026-09-10T00:00:00Z',
    downloadsCount: 750,
    starsCount: 52,
  },
];

const LOCAL_STORAGE_KEY = 'branchwatch_user_plugins_v2';

export function loadInstalledPlugins(): PluginNodeDefinition[] {
  if (typeof window === 'undefined') return OFFICIAL_STARTER_PLUGINS;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(OFFICIAL_STARTER_PLUGINS));
      return OFFICIAL_STARTER_PLUGINS;
    }
    const parsed: PluginNodeDefinition[] = JSON.parse(raw);
    return parsed;
  } catch {
    return OFFICIAL_STARTER_PLUGINS;
  }
}

export function savePlugin(plugin: PluginNodeDefinition): void {
  if (typeof window === 'undefined') return;

  const current = loadInstalledPlugins();
  const existingIdx = current.findIndex((p) => p.id === plugin.id);

  let updated: PluginNodeDefinition[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...plugin, installed: true };
  } else {
    updated = [{ ...plugin, installed: true, source: plugin.source || 'local' }, ...current];
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

export function removePlugin(pluginId: string): void {
  if (typeof window === 'undefined') return;

  const current = loadInstalledPlugins();
  const updated = current.filter((p) => p.id !== pluginId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

export const getInstalledPlugins = loadInstalledPlugins;
export const saveCustomPlugin = savePlugin;

export function getAllAvailablePlugins(): PluginNodeDefinition[] {
  const installed = loadInstalledPlugins();
  const installedMap = new Map(installed.map((p) => [p.id, p]));

  // Merge starter plugins with user installed/created plugins
  const all: PluginNodeDefinition[] = [...installed];
  OFFICIAL_STARTER_PLUGINS.forEach((starter) => {
    if (!installedMap.has(starter.id)) {
      all.push({ ...starter, installed: false });
    }
  });

  return all;
}

export function installPlugin(pluginId: string): void {
  const all = getAllAvailablePlugins();
  const target = all.find((p) => p.id === pluginId);
  if (target) {
    savePlugin({ ...target, installed: true });
  }
}

export function uninstallPlugin(pluginId: string): void {
  removePlugin(pluginId);
}

export function deleteCustomPlugin(pluginId: string): void {
  removePlugin(pluginId);
}
