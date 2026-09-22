import { Repository, Branch, Commit, BranchComparison, BranchStatusType, ActivityItem, GitHubUser } from './types';
import { MOCK_REPOSITORIES, MOCK_BRANCHES, MOCK_COMMITS, MOCK_ACTIVITIES } from './mockData';

export function calculateBranchStatus(dateString?: string): BranchStatusType {
  if (!dateString) return 'quiet';
  const commitTime = new Date(dateString).getTime();
  const now = Date.now();
  const diffHours = (now - commitTime) / (1000 * 60 * 60);

  if (diffHours <= 48) {
    return 'active';
  } else if (diffHours <= 14 * 24) {
    return 'quiet';
  } else {
    return 'stale';
  }
}

export async function fetchAuthenticatedUser(token: string): Promise<GitHubUser | null> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        login: data.login,
        name: data.name || data.login,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
      };
    }
  } catch (err) {
    console.error('Error fetching authenticated GitHub user:', err);
  }
  return null;
}

export async function fetchUserRepositories(token?: string | null): Promise<Repository[]> {
  if (!token) {
    return MOCK_REPOSITORIES;
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', { headers });

    if (!res.ok) {
      console.warn('GitHub API user repos failed:', res.status, await res.text());
      return [];
    }

    const repos: any[] = await res.json();

    if (!Array.isArray(repos)) {
      console.warn('GitHub repos response was not an array:', repos);
      return [];
    }

    // Return repos with real branch and commit counts fetched in parallel
    const enrichedRepos = await Promise.all(
      repos.map(async (r: any) => {
        const baseRepo: Repository = {
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          owner: {
            login: r.owner.login,
            avatar_url: r.owner.avatar_url,
          },
          private: r.private ?? false,
          description: r.description,
          html_url: r.html_url,
          default_branch: r.default_branch || 'main',
          updated_at: r.updated_at,
          stargazers_count: r.stargazers_count || 0,
          forks_count: r.forks_count || 0,
          open_issues_count: r.open_issues_count || 0,
          branches_count: 1,
          commits_count: 0,
          contributors_count: 1,
        };

        // If repo is empty (size === 0 or no commits), return immediately without 409 requests
        if (r.size === 0 || !r.default_branch) {
          return {
            ...baseRepo,
            branches_count: 0,
            commits_count: 0,
          };
        }

        try {
          const [bRes, cRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${r.owner.login}/${r.name}/branches?per_page=100`, { headers }).catch(() => null),
            fetch(`https://api.github.com/repos/${r.owner.login}/${r.name}/commits?per_page=1`, { headers }).catch(() => null),
          ]);

          let realBranchCount = 1;
          if (bRes && bRes.ok) {
            const bData = await bRes.json();
            if (Array.isArray(bData)) realBranchCount = bData.length;
          }

          let realCommitCount = 0;
          if (cRes && cRes.ok) {
            const linkHeader = cRes.headers.get('link');
            if (linkHeader) {
              const match = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (match) realCommitCount = parseInt(match[1], 10);
            } else {
              const cData = await cRes.json();
              if (Array.isArray(cData)) realCommitCount = cData.length;
            }
          }

          return {
            ...baseRepo,
            branches_count: realBranchCount,
            commits_count: realCommitCount,
          };
        } catch {
          return baseRepo;
        }
      })
    );

    return enrichedRepos;
  } catch (err) {
    console.error('Error fetching real user repositories:', err);
    return [];
  }
}

export async function fetchPublicRepository(owner: string, repo: string, token?: string | null): Promise<Repository | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (res.ok) {
      const data = await res.json();
      let realBranchCount = 0;
      let realCommitCount = 0;

      try {
        const bRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers });
        if (bRes.ok) {
          const bData = await bRes.json();
          realBranchCount = Array.isArray(bData) ? bData.length : 0;
        }

        const cRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
        if (cRes.ok) {
          const linkHeader = cRes.headers.get('link');
          if (linkHeader) {
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (match) realCommitCount = parseInt(match[1], 10);
          } else {
            const cData = await cRes.json();
            realCommitCount = Array.isArray(cData) ? cData.length : 0;
          }
        }
      } catch {}

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        owner: { login: data.owner.login, avatar_url: data.owner.avatar_url },
        private: data.private ?? false,
        description: data.description,
        html_url: data.html_url,
        default_branch: data.default_branch || 'main',
        updated_at: data.updated_at,
        stargazers_count: data.stargazers_count || 0,
        forks_count: data.forks_count || 0,
        open_issues_count: data.open_issues_count || 0,
        branches_count: realBranchCount,
        commits_count: realCommitCount,
        contributors_count: 1,
      };
    }
  } catch (err) {
    console.error(`Error fetching repo ${owner}/${repo}:`, err);
  }

  return null;
}

export async function fetchBranches(owner: string, repo: string, token?: string | null): Promise<Branch[]> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers });
    
    // Fallback unauthenticated retry
    if (!res.ok && token) {
      res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });
    }

    if (res.ok) {
      const branchesData = await res.json();
      if (Array.isArray(branchesData)) {
        if (branchesData.length === 0) return [];
        const branchesWithCommits: Branch[] = branchesData.map((b: any) => ({
          name: b.name,
          commit: { sha: b.commit?.sha ? b.commit.sha.substring(0, 7) : 'latest', url: b.commit?.url || '' },
          protected: b.protected || false,
          lastCommitDate: new Date().toISOString(),
          lastCommitMessage: 'Branch commit',
          lastCommitAuthor: { name: owner, avatar_url: '' },
          commitCount: 1,
          status: 'active' as BranchStatusType,
        }));
        return branchesWithCommits;
      }
    } else if (res.status === 409 || res.status === 404) {
      // 409 = Git Repository is empty
      return [];
    }
  } catch (err) {
    console.error(`Error fetching real branches for ${owner}/${repo}:`, err);
  }

  // If user is authenticated, return actual real state (empty array)
  if (token) {
    return [];
  }

  // Demo mode fallback only
  const mockFallback = MOCK_BRANCHES[`${owner}/${repo}`];
  if (mockFallback && mockFallback.length > 0) return mockFallback;

  return [];
}

export async function fetchBranchCommits(owner: string, repo: string, branchName: string, token?: string | null): Promise<Commit[]> {
  if (!branchName) return [];
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branchName)}&per_page=50`, { headers });
    if (!res.ok && token) {
      res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branchName)}&per_page=50`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });
    }

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } else if (res.status === 409 || res.status === 404) {
      return [];
    }
  } catch (err) {
    console.error(`Error fetching real commits for branch ${branchName}:`, err);
  }

  if (token) return [];

  const mockCommits = MOCK_COMMITS[branchName];
  if (mockCommits && mockCommits.length > 0) return mockCommits;

  return [];
}

export async function fetchCommitDetail(owner: string, repo: string, ref: string, token?: string | null): Promise<Commit | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token && token.trim().length > 0) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${ref}`, { headers });
    if (res.ok) {
      const data: Commit = await res.json();
      return data;
    }
  } catch {}

  return null;
}

export async function compareBranches(
  owner: string,
  repo: string,
  base: string,
  head: string,
  token?: string | null
): Promise<BranchComparison> {
  if (base === head) {
    return {
      baseBranch: base,
      headBranch: head,
      ahead_by: 0,
      behind_by: 0,
      total_commits: 0,
      commits: [],
      files: [],
      stats: { additions: 0, deletions: 0, total_files: 0 },
    };
  }

  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      { headers }
    );

    if (!res.ok && token) {
      res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
    }

    if (res.ok) {
      const data = await res.json();
      return {
        baseBranch: base,
        headBranch: head,
        ahead_by: data.ahead_by || 0,
        behind_by: data.behind_by || 0,
        total_commits: data.total_commits || (data.commits?.length ?? 0),
        commits: (data.commits || []).map((c: any) => ({
          sha: c.sha,
          commit: c.commit,
          author: c.author,
          html_url: c.html_url,
          stats: c.stats,
          files: c.files,
        })),
        files: data.files || [],
        stats: {
          additions: data.files?.reduce((acc: number, f: any) => acc + (f.additions || 0), 0) || 0,
          deletions: data.files?.reduce((acc: number, f: any) => acc + (f.deletions || 0), 0) || 0,
          total_files: data.files?.length || 0,
        },
      };
    }
  } catch (err) {
    console.error(`Error comparing ${base}...${head}:`, err);
  }

  return {
    baseBranch: base,
    headBranch: head,
    ahead_by: 0,
    behind_by: 0,
    total_commits: 0,
    commits: [],
    files: [],
    stats: { additions: 0, deletions: 0, total_files: 0 },
  };
}

export async function fetchRecentActivities(owner: string, repo: string, token?: string | null): Promise<ActivityItem[]> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=30`, { headers });
    if (res.ok) {
      const events: any[] = await res.json();
      if (events.length > 0) {
        const mapped: ActivityItem[] = [];
        events.forEach((e, idx) => {
          if (e.type === 'PushEvent') {
            const commits = e.payload?.commits || [];
            const latestCommitMsg = commits.length > 0 ? commits[commits.length - 1]?.message : null;
            const commitCount = e.payload?.size || commits.length || 1;
            const branchName = e.payload?.ref?.replace('refs/heads/', '') || 'main';
            const displayMsg = latestCommitMsg || `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to ${branchName}`;

            mapped.push({
              id: e.id || `evt-${idx}`,
              type: 'commit',
              author: {
                name: e.actor?.display_login || e.actor?.login || 'Developer',
                avatar_url: e.actor?.avatar_url,
              },
              branch: branchName,
              message: displayMsg,
              sha: commits[0]?.sha?.substring(0, 7) || e.payload?.head?.substring(0, 7) || e.id.substring(0, 7),
              timestamp: e.created_at,
            });
          } else if (e.type === 'CreateEvent') {
            const refType = e.payload?.ref_type || 'branch';
            const refName = e.payload?.ref || 'main';
            mapped.push({
              id: e.id || `evt-${idx}`,
              type: 'branch_created',
              author: {
                name: e.actor?.display_login || e.actor?.login || 'Developer',
                avatar_url: e.actor?.avatar_url,
              },
              branch: refName,
              message: `Created ${refType} ${refName}`,
              sha: e.id.substring(0, 7),
              timestamp: e.created_at,
            });
          }
        });
        if (mapped.length > 0) return mapped;
      }
    }

    // Fallback: fetch real commits directly
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`, { headers });
    if (commitRes.ok) {
      const realCommits: any[] = await commitRes.json();
      if (Array.isArray(realCommits) && realCommits.length > 0) {
        return realCommits.map((c, idx) => ({
          id: c.sha || `commit-${idx}`,
          type: 'commit',
          author: {
            name: c.commit?.author?.name || c.author?.login || 'Developer',
            avatar_url: c.author?.avatar_url || '',
          },
          branch: 'main',
          message: c.commit?.message || 'Update repository',
          sha: c.sha?.substring(0, 7) || 'head',
          timestamp: c.commit?.author?.date || new Date().toISOString(),
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching real activities:', err);
  }

  return [];
}

export async function checkUserStarredRepo(owner: string, repo: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return res.status === 204;
  } catch (err) {
    console.error('Error checking star status:', err);
    return false;
  }
}

export async function starRepositoryOnGitHub(owner: string, repo: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Length': '0',
      },
    });
    return res.status === 204;
  } catch (err) {
    console.error('Error starring repository on GitHub:', err);
    return false;
  }
}

export async function unstarRepositoryOnGitHub(owner: string, repo: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return res.status === 204;
  } catch (err) {
    console.error('Error unstarring repository on GitHub:', err);
    return false;
  }
}

