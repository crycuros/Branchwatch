import { PortDataType, NodePermissions, WebhookConfig } from './workflowTypes';

export type PluginCategory = 'git' | 'automation' | 'testing' | 'notification' | 'security' | 'devops' | 'custom';

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

export type PluginRuntime = 'shell' | 'nodejs' | 'python' | 'webhook';

export interface PluginNodeDefinition {
  schemaVersion: 1;
  id: string; // e.g. "my-project.typecheck", "team.docker-build"
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    login?: string;
    avatar_url?: string;
  };
  homepage?: string;
  tags?: string[];
  platforms?: ('windows' | 'linux' | 'darwin')[];
  iconName: string; // Lucide icon identifier
  category: PluginCategory;
  
  runtime: PluginRuntime;
  permissions: NodePermissions;
  
  inputPort: {
    type: PortDataType;
    label: string;
  };
  outputPort: {
    type: PortDataType;
    label: string;
  };
  
  configSchema: ConfigFieldSchema[];
  
  // Script configuration
  commandTemplate?: string;
  scriptContent?: string;
  timeoutMs?: number;
  
  // Webhook configuration
  webhookConfig?: WebhookConfig;
  
  // Composable Inputs & Outputs
  inputs?: Record<string, string>;
  outputs?: Record<string, string>;
  
  onFailure?: 'halt' | 'continue';
  source?: 'workspace' | 'local' | 'community';
  
  documentationUrl?: string;
  isOfficial?: boolean;
  installed?: boolean;
  createdAt: string;
  downloadsCount?: number;
  starsCount?: number;
}
