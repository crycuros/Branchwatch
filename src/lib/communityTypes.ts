import { WorkflowNode, NodeConnection } from './workflowTypes';

export type WorkflowVisibility = 'public' | 'unlisted' | 'private';

export type WorkflowCategory =
  | 'all'
  | 'enterprise'
  | 'startup'
  | 'casual'
  | 'opensource'
  | 'hotfix'
  | 'monorepo'
  | 'basics'
  | 'feature'
  | 'release'
  | 'cicd';

export interface WorkflowAuthor {
  login: string;
  name: string;
  avatar_url?: string;
  isVerified?: boolean;
}

export interface WorkflowComment {
  id: string;
  workflowId: string;
  author: WorkflowAuthor;
  text: string;
  createdAt: string;
  parentId?: string; // For replies
}

export interface WorkflowVersion {
  version: string;
  description: string;
  createdAt: string;
  nodesSnapshot: WorkflowNode[];
  connectionsSnapshot: NodeConnection[];
}

export interface EducationalNote {
  title: string;
  explanation: string;
  command: string;
  bestPracticeTip?: string;
}

export interface CommunityWorkflow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: WorkflowCategory;
  visibility: WorkflowVisibility;
  author: WorkflowAuthor;
  version: string;
  versions?: WorkflowVersion[];
  forksCount: number;
  starsCount: number;
  usageCount: number;
  tags: string[];
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  educationalNotes?: Record<string, EducationalNote>; // Keyed by node ID or type
  forkedFrom?: {
    workflowId: string;
    title: string;
    author: WorkflowAuthor;
  };
  comments?: WorkflowComment[];
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}
