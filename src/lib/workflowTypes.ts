export type NodeType = 'working_tree' | 'stage' | 'commit' | 'branch' | 'pull' | 'push' | 'plugin';
export type NodeStatusType = 'draft' | 'ready' | 'executing' | 'success' | 'failed' | 'skipped';

// Typed port system — each port has a semantic data type
export type PortDataType =
  | 'WorkingTreeChanges'
  | 'StagedChanges'
  | 'CommitRef'
  | 'BranchRef'
  | 'RemoteRef'
  | 'None';

export interface PortDefinition {
  type: PortDataType;
  label: string;
}

// What each node produces (output) and consumes (input)
export const NODE_PORT_DEFINITIONS: Record<
  NodeType,
  { input: PortDefinition; output: PortDefinition }
> = {
  working_tree: {
    input: { type: 'None', label: 'No input required' },
    output: { type: 'WorkingTreeChanges', label: 'WorkingTree Changes' },
  },
  stage: {
    input: { type: 'WorkingTreeChanges', label: 'WorkingTree Changes' },
    output: { type: 'StagedChanges', label: 'Staged Changes' },
  },
  commit: {
    input: { type: 'StagedChanges', label: 'Staged Changes' },
    output: { type: 'CommitRef', label: 'Commit Reference' },
  },
  branch: {
    input: { type: 'CommitRef', label: 'Commit Reference' },
    output: { type: 'BranchRef', label: 'Branch Reference' },
  },
  pull: {
    input: { type: 'BranchRef', label: 'Branch Reference' },
    output: { type: 'WorkingTreeChanges', label: 'Merged Changes' },
  },
  push: {
    input: { type: 'BranchRef', label: 'Branch Reference' },
    output: { type: 'RemoteRef', label: 'Remote Reference' },
  },
  plugin: {
    input: { type: 'BranchRef', label: 'Input Reference' },
    output: { type: 'BranchRef', label: 'Output Reference' },
  },
};

export interface ExecutionLogEntry {
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  command?: string;
  output?: string;
  error?: string;
  exitCode?: number;
  httpStatus?: number;
  rawResponse?: any;
}

export interface BranchCommitEntry {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface NodePermissions {
  filesystem?: 'none' | 'workspace' | 'all';
  network?: boolean;
  git?: boolean;
  shell?: boolean;
}

export interface NodeCondition {
  sourceNodeId: string;
  field: 'exitCode' | 'stdout' | 'status' | string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_truthy';
  value: any;
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

export interface WorkflowNodeConfig {
  commitMessage?: string;
  selectedFiles?: string[];
  branchName?: string;
  remoteName?: string;
  filesChangedCount?: number;
  additions?: number;
  deletions?: number;
  sha?: string;
  committedAt?: string;
  errorMessage?: string;
  authorName?: string;
  authorAvatar?: string;
  commitUrl?: string;
  aheadBy?: number;
  behindBy?: number;
  baseBranchName?: string;
  availableBranches?: string[];
  isCurrentBranch?: boolean;
  branchCommits?: BranchCommitEntry[];
  branchFiles?: {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
  }[];
  pluginId?: string;
  pluginName?: string;
  pluginIcon?: string;
  pluginSource?: 'workspace' | 'local' | 'community';
  runtime?: 'builtin' | 'shell' | 'nodejs' | 'python' | 'webhook';
  permissions?: NodePermissions;
  scriptContent?: string;
  timeoutMs?: number;
  inputs?: Record<string, string>;
  outputs?: Record<string, string>;
  webhookConfig?: WebhookConfig;
  onFailure?: 'halt' | 'continue';
  condition?: NodeCondition;
  inputPortType?: PortDataType;
  outputPortType?: PortDataType;
  customParams?: Record<string, any>;
  commandTemplate?: string;
  executionLog?: ExecutionLogEntry;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  status: NodeStatusType;
  config: WorkflowNodeConfig;
}

export interface NodeConnection {
  id: string;
  fromId: string;
  toId: string;
  condition?: NodeCondition;
}

export interface WorkflowValidationIssue {
  type: 'error' | 'warning';
  nodeId?: string;
  message: string;
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  historyStack: { nodes: WorkflowNode[]; connections: NodeConnection[] }[];
  historyIndex: number;
}

export interface ExecutionStep {
  nodeId: string;
  nodeTitle: string;
  nodeType: NodeType;
  command: string;
  description: string;
  isDangerous?: boolean;
  status: 'queued' | 'executing' | 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  exitCode?: number;
  durationMs?: number;
  outputs?: Record<string, any>;
}

export interface WorkflowExecutionEvent {
  type: 'start' | 'stdout' | 'stderr' | 'exit' | 'http_response' | 'error' | 'skipped';
  nodeId: string;
  nodeTitle: string;
  data: string;
  timestamp: string;
  exitCode?: number;
  status?: number;
  durationMs?: number;
  outputs?: Record<string, any>;
}
