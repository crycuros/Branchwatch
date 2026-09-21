import { CommunityWorkflow, WorkflowComment, WorkflowAuthor } from './communityTypes';
import { OFFICIAL_TEMPLATES } from './communityTemplates';
import { WorkflowNode, NodeConnection } from './workflowTypes';

const STORAGE_KEYS = {
  COMMUNITY_WORKFLOWS: 'branchwatch_community_workflows',
  STARRED_WORKFLOWS: 'branchwatch_starred_workflows',
  USER_FORKS: 'branchwatch_user_forks',
  COMMENTS: 'branchwatch_workflow_comments',
};

// Security Sanitizer: Cleans workflow nodes of any secrets or tokens before sharing
export function sanitizeWorkflowForPublishing(
  title: string,
  description: string,
  nodes: WorkflowNode[],
  connections: NodeConnection[],
  author: WorkflowAuthor,
  category: CommunityWorkflow['category'] = 'feature',
  visibility: CommunityWorkflow['visibility'] = 'public',
  tags: string[] = ['git-workflow']
): CommunityWorkflow {
  // Strip any accidental tokens, keys, or sensitive paths
  const cleanNodes: WorkflowNode[] = nodes.map((node) => {
    const cleanConfig = { ...node.config };

    // Strip sensitive execution output if it contains auth strings
    if (cleanConfig.executionLog?.command?.includes('token') || cleanConfig.executionLog?.command?.includes('secret')) {
      delete cleanConfig.executionLog;
    }

    return {
      id: node.id,
      type: node.type,
      title: node.title,
      x: node.x,
      y: node.y,
      status: 'draft' as const, // Reset status to draft for public templates
      config: cleanConfig,
    };
  });

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    id: `wf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    slug,
    title: title.trim(),
    description: description.trim() || 'A reusable visual Git workflow.',
    category,
    visibility,
    author: {
      login: author.login || 'developer',
      name: author.name || 'BranchWatch Developer',
      avatar_url: author.avatar_url,
    },
    version: 'v1.0',
    forksCount: 0,
    starsCount: 0,
    usageCount: 1,
    tags: tags.length > 0 ? tags : ['git-workflow'],
    nodes: cleanNodes,
    connections: [...connections],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getCommunityWorkflows(): CommunityWorkflow[] {
  if (typeof window === 'undefined') return OFFICIAL_TEMPLATES;

  try {
    const custom = localStorage.getItem(STORAGE_KEYS.COMMUNITY_WORKFLOWS);
    if (!custom) return OFFICIAL_TEMPLATES;

    const parsed: CommunityWorkflow[] = JSON.parse(custom);
    // Combine official templates with custom user published workflows
    const customIds = new Set(parsed.map((w) => w.id));
    const merged = [
      ...parsed,
      ...OFFICIAL_TEMPLATES.filter((t) => !customIds.has(t.id)),
    ];
    return merged;
  } catch (e) {
    console.error('Failed reading community workflows:', e);
    return OFFICIAL_TEMPLATES;
  }
}

export function saveCommunityWorkflow(workflow: CommunityWorkflow): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getCommunityWorkflows();
    const updated = [workflow, ...existing.filter((w) => w.id !== workflow.id)];
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_WORKFLOWS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed saving community workflow:', e);
  }
}

export function getStarredWorkflowIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STARRED_WORKFLOWS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleStarWorkflow(workflowId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const starred = getStarredWorkflowIds();
    const isStarred = starred.includes(workflowId);
    const updated = isStarred
      ? starred.filter((id) => id !== workflowId)
      : [...starred, workflowId];

    localStorage.setItem(STORAGE_KEYS.STARRED_WORKFLOWS, JSON.stringify(updated));

    // Update count in workflow list
    const workflows = getCommunityWorkflows();
    const target = workflows.find((w) => w.id === workflowId);
    if (target) {
      target.starsCount = Math.max(0, target.starsCount + (isStarred ? -1 : 1));
      saveCommunityWorkflow(target);
    }

    return !isStarred;
  } catch {
    return false;
  }
}

export function incrementForkCount(workflowId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const workflows = getCommunityWorkflows();
    const target = workflows.find((w) => w.id === workflowId);
    if (target) {
      target.forksCount += 1;
      saveCommunityWorkflow(target);
    }
  } catch (e) {
    console.error('Failed incrementing fork count:', e);
  }
}

export function getWorkflowComments(workflowId: string): WorkflowComment[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.COMMENTS}_${workflowId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addWorkflowComment(
  workflowId: string,
  text: string,
  author: WorkflowAuthor,
  parentId?: string
): WorkflowComment {
  const newComment: WorkflowComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    workflowId,
    author,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    parentId,
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getWorkflowComments(workflowId);
      const updated = [...existing, newComment];
      localStorage.setItem(`${STORAGE_KEYS.COMMENTS}_${workflowId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving comment:', e);
    }
  }

  return newComment;
}
