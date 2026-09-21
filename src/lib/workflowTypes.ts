export type NodeType = 'working_tree' | 'stage' | 'commit' | 'branch' | 'pull' | 'push';
export type NodeStatusType = 'draft' | 'ready' | 'executing' | 'success' | 'failed';

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
};

export interface ExecutionLogEntry {
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  command?: string;
  output?: string;
  error?: string;
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
  status: 'queued' | 'executing' | 'success' | 'failed';
  output?: string;
  error?: string;
}
