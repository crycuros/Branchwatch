export type BranchStatusType = 'active' | 'quiet' | 'stale';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name?: string;
  html_url: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  branches_count?: number;
  commits_count?: number;
  contributors_count?: number;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  lastCommitDate?: string;
  lastCommitMessage?: string;
  lastCommitAuthor?: {
    name: string;
    avatar_url?: string;
  };
  commitCount?: number;
  status: BranchStatusType;
}

export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
  avatar_url?: string;
  login?: string;
}

export interface CommitFileChange {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: CommitFileChange[];
  branch?: string;
}

export interface BranchComparison {
  baseBranch: string;
  headBranch: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: Commit[];
  files: CommitFileChange[];
  stats: {
    additions: number;
    deletions: number;
    total_files: number;
  };
}

export interface ActivityItem {
  id: string;
  type: 'push' | 'branch_created' | 'branch_deleted' | 'commit';
  author: {
    name: string;
    avatar_url?: string;
  };
  branch: string;
  message: string;
  sha: string;
  timestamp: string;
}

export interface RepositorySummary {
  repo: Repository;
  branches: Branch[];
  recentActivity: ActivityItem[];
}
