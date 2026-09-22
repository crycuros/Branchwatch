import { PortDataType } from './workflowTypes';

export type PluginCategory = 'git' | 'automation' | 'notification' | 'security' | 'custom';

export type ConfigFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select';

export interface ConfigFieldSchema {
  key: string;
  label: string;
  type: ConfigFieldType;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  description?: string;
  required?: boolean;
}

export interface PluginNodeDefinition {
  id: string; // e.g. "plugin-stash", "plugin-rebase-sync"
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    login: string;
    avatar_url?: string;
  };
  iconName: string; // Lucide icon identifier: 'Archive', 'GitMerge', 'Tag', 'Trash2', 'GitPullRequest', etc.
  category: PluginCategory;
  inputPort: {
    type: PortDataType;
    label: string;
  };
  outputPort: {
    type: PortDataType;
    label: string;
  };
  configSchema: ConfigFieldSchema[];
  commandTemplate: string; // e.g. "git stash push -m \"{{message}}\"" or "git tag -a {{version}} -m \"{{notes}}\""
  documentationUrl?: string;
  isOfficial?: boolean;
  installed?: boolean;
  createdAt: string;
  downloadsCount?: number;
  starsCount?: number;
}
