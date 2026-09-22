/**
 * communityStorage.ts — API-backed community data layer
 *
 * All reads/writes now go through Next.js API routes backed by SQLite (local)
 * or PostgreSQL (EC2). Zero localStorage dependency for community data.
 *
 * Auth headers (x-user-login, x-user-name, x-user-avatar) are attached
 * automatically from the authUser stored in module-level state via setCurrentUser().
 */

import { CommunityWorkflow, WorkflowAuthor } from './communityTypes';
import { WorkflowNode, NodeConnection } from './workflowTypes';

// ─── Current User Context (set from page.tsx when token changes) ─────────────

let _currentUser: { login: string; name: string; avatar_url?: string } | null = null;

export function setCurrentUser(user: { login: string; name: string; avatar_url?: string } | null) {
  _currentUser = user;
}

function authHeaders(): Record<string, string> {
  if (!_currentUser) return {};
  return {
    'x-user-login': _currentUser.login,
    'x-user-name': _currentUser.name,
    'x-user-avatar': _currentUser.avatar_url || '',
  };
}

// ─── Fetch Helpers ────────────────────────────────────────────────────────────

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
  return res.json();
}

// ─── Security Sanitizer ───────────────────────────────────────────────────────
// Strips any tokens/secrets from node configs before publishing

export function sanitizeWorkflowForPublishing(
  title: string,
  description: string,
  nodes: WorkflowNode[],
  connections: NodeConnection[],
  author: WorkflowAuthor,
  category: CommunityWorkflow['category'] = 'feature',
  visibility: CommunityWorkflow['visibility'] = 'public',
  tags: string[] = ['git-workflow']
): Omit<CommunityWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'starsCount' | 'forksCount' | 'usageCount'> {
  const cleanNodes: WorkflowNode[] = nodes.map((node) => {
    const cleanConfig = { ...node.config };
    if (
      cleanConfig.executionLog?.command?.includes('token') ||
      cleanConfig.executionLog?.command?.includes('secret')
    ) {
      delete cleanConfig.executionLog;
    }
    return { id: node.id, type: node.type, title: node.title, x: node.x, y: node.y, status: 'draft' as const, config: cleanConfig };
  });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return {
    slug,
    title: title.trim(),
    description: description.trim() || 'A reusable visual Git workflow.',
    category,
    visibility,
    author: { login: author.login || 'developer', name: author.name || 'BranchWatch Developer', avatar_url: author.avatar_url },
    version: 'v1.0',
    tags: tags.length > 0 ? tags : ['git-workflow'],
    nodes: cleanNodes,
    connections: [...connections],
  };
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function getCommunityWorkflows(opts?: {
  category?: string;
  search?: string;
  sort?: string;
}): Promise<CommunityWorkflow[]> {
  const params = new URLSearchParams();
  if (opts?.category) params.set('category', opts.category);
  if (opts?.search) params.set('search', opts.search);
  if (opts?.sort) params.set('sort', opts.sort);
  return apiGet<CommunityWorkflow[]>(`/api/community/workflows?${params.toString()}`);
}

export async function publishCommunityWorkflow(
  payload: Omit<CommunityWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'starsCount' | 'forksCount' | 'usageCount'>
): Promise<CommunityWorkflow> {
  return apiPost<CommunityWorkflow>('/api/community/workflows', payload);
}

// ─── Stars ────────────────────────────────────────────────────────────────────

export async function toggleStarWorkflow(
  workflowId: string
): Promise<{ starred: boolean; starsCount: number }> {
  return apiPost<{ starred: boolean; starsCount: number }>(
    `/api/community/workflows/${workflowId}/star`
  );
}

export async function checkStarredWorkflow(workflowId: string): Promise<boolean> {
  try {
    const result = await apiGet<{ starred: boolean }>(
      `/api/community/workflows/${workflowId}/star`
    );
    return result.starred;
  } catch {
    return false;
  }
}

// ─── Forks ────────────────────────────────────────────────────────────────────

export async function forkWorkflow(workflowId: string): Promise<CommunityWorkflow> {
  return apiPost<CommunityWorkflow>(`/api/community/workflows/${workflowId}/fork`);
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface DBComment {
  id: string;
  workflowId: string;
  userLogin: string;
  userName: string;
  userAvatar: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export async function getWorkflowComments(workflowId: string): Promise<DBComment[]> {
  return apiGet<DBComment[]>(`/api/community/workflows/${workflowId}/comments`);
}

export async function addWorkflowComment(workflowId: string, body: string): Promise<DBComment> {
  return apiPost<DBComment>(`/api/community/workflows/${workflowId}/comments`, { body });
}

export async function deleteWorkflowComment(
  workflowId: string,
  commentId: string
): Promise<void> {
  await fetch(`/api/community/workflows/${workflowId}/comments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ commentId }),
  });
}

// ─── Legacy no-ops (kept so existing call sites don't break during migration) ─

/** @deprecated Use getCommunityWorkflows() async instead */
export function getStarredWorkflowIds(): string[] { return []; }
/** @deprecated Use forkWorkflow() async instead */
export function incrementForkCount(_workflowId: string): void {}
/** @deprecated Use publishCommunityWorkflow() async instead */
export function saveCommunityWorkflow(_workflow: CommunityWorkflow): void {}
