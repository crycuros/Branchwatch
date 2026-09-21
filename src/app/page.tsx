'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Repository, Branch, Commit, ActivityItem, GitHubUser } from '@/lib/types';
import {
  fetchUserRepositories,
  fetchPublicRepository,
  fetchBranches,
  fetchBranchCommits,
  fetchRecentActivities,
  fetchAuthenticatedUser,
} from '@/lib/github';

import { LandingPage } from '@/components/LandingPage';
import { TopBar } from '@/components/TopBar';
import { AppShell, NavTab } from '@/components/AppShell';
import { RepositoryHeader } from '@/components/RepositoryHeader';
import { RepositorySelector } from '@/components/RepositorySelector';
import { BranchList } from '@/components/BranchList';
import { CommitTimeline } from '@/components/CommitTimeline';
import { CommitDetailDrawer } from '@/components/CommitDetailDrawer';
import { BranchCompare } from '@/components/BranchCompare';
import { ActivityFeed } from '@/components/ActivityFeed';
import { SearchModal } from '@/components/SearchModal';
import { VisualWorkflow } from '@/components/visual/VisualWorkflow';
import { GitGraphView } from '@/components/v3/GitGraphView';
import { CommunityHub } from '@/components/community/CommunityHub';
import { WorkflowDiscussions } from '@/components/community/WorkflowDiscussions';
import { CommunityWorkflow } from '@/lib/communityTypes';
import { incrementForkCount } from '@/lib/communityStorage';
import { ShieldCheck, Github } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const [isLandingPage, setIsLandingPage] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<GitHubUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Core Data State
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Community & Workflow State
  const [selectedCommunityWorkflow, setSelectedCommunityWorkflow] = useState<CommunityWorkflow | null>(null);
  const [selectedDiscussionsWorkflow, setSelectedDiscussionsWorkflow] = useState<CommunityWorkflow | null>(null);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  // OAuth Callback & Secure Session Verification
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.token) {
          setToken(data.token);
          if (data.user) setAuthUser(data.user);
          setIsLandingPage(false);
          loadUserDataAndRepos(data.token);
          return;
        }
      } catch (e) {
        console.error('Session check error:', e);
      }

      // Check fallback storage token
      try {
        const storageToken = localStorage.getItem('branchwatch_github_token');
        if (storageToken) {
          setToken(storageToken);
          setIsLandingPage(false);
          loadUserDataAndRepos(storageToken);
        }
      } catch (e) {}
    };

    // Clean any query params from URL (e.g. ?auth=success or ?auth_error=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('auth') || urlParams.has('auth_error')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    checkSession();
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K on Windows/Linux, Cmd+K on macOS)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        // Prevent default browser search/address bar focus
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadUserDataAndRepos = async (activeToken: string) => {
    setIsUpdating(true);
    try {
      if (activeToken) {
        const user = await fetchAuthenticatedUser(activeToken);
        if (user) setAuthUser(user);
      }

      const repos = await fetchUserRepositories(activeToken);

      // Restore custom repos from localStorage if any
      const savedCustomStr = localStorage.getItem('branchwatch_custom_repos');
      let combinedRepos = repos;
      if (savedCustomStr) {
        try {
          const customList: Repository[] = JSON.parse(savedCustomStr);
          const existingIds = new Set(repos.map((r) => r.id));
          const newCustom = customList.filter((r) => !existingIds.has(r.id));
          combinedRepos = [...newCustom, ...repos];
        } catch (e) {}
      }

      setRepositories(combinedRepos);

      if (combinedRepos.length > 0) {
        // Restore previously selected repository from localStorage if available
        const savedRepoFullName = localStorage.getItem('branchwatch_selected_repo');
        const targetRepo = combinedRepos.find((r) => r.full_name === savedRepoFullName) || combinedRepos[0];
        await selectRepository(targetRepo, activeToken);
      }
    } catch (err) {
      console.error('Failed loading authenticated user repos:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectRepository = async (repo: Repository, activeToken?: string | null) => {
    setCurrentRepo(repo);
    setSelectedBranch(null);
    setBranches([]);
    setCommits([]);
    setActivities([]);
    setIsUpdating(true);

    // Save selected repository name to localStorage for persistence across page reloads
    try {
      localStorage.setItem('branchwatch_selected_repo', repo.full_name);
    } catch (e) {}

    try {
      const currentTok = activeToken ?? token;
      const repoBranches = await fetchBranches(repo.owner.login, repo.name, currentTok);
      setBranches(repoBranches);

      const defaultBranchObj = repoBranches.find((b) => b.name === repo.default_branch) || repoBranches[0];
      if (defaultBranchObj) {
        const branchCommits = await fetchBranchCommits(repo.owner.login, repo.name, defaultBranchObj.name, currentTok);
        setCommits(branchCommits);
      } else {
        setCommits([]);
      }

      const recentActs = await fetchRecentActivities(repo.owner.login, repo.name, currentTok);
      setActivities(recentActs);
    } catch (err) {
      console.error('Failed selecting repo:', err);
      setBranches([]);
      setCommits([]);
      setActivities([]);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartOAuth = () => {
    window.location.href = '/api/auth/github';
  };

  const handleConnectToken = async (t: string) => {
    const cleanToken = t.trim();
    if (!cleanToken) return;

    setToken(cleanToken);
    try {
      // Securely store token via session route
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });
    } catch (e) {}

    setIsLandingPage(false);
    loadUserDataAndRepos(cleanToken);
  };

  const handleFetchCustomRepo = async (ownerRepoStr: string) => {
    const parts = ownerRepoStr.split('/');
    if (parts.length < 2) return;
    const owner = parts[0].trim();
    const repo = parts[1].trim();

    setIsUpdating(true);
    try {
      const customRepo = await fetchPublicRepository(owner, repo, token);
      if (customRepo) {
        setRepositories((prev) => {
          const updated = [customRepo, ...prev.filter((r) => r.id !== customRepo.id)];
          try {
            localStorage.setItem('branchwatch_custom_repos', JSON.stringify(updated.filter((r) => r.private === undefined)));
          } catch (e) {}
          return updated;
        });
        await selectRepository(customRepo, token);
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Failed fetching custom repo:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectBranch = async (b: Branch) => {
    setSelectedBranch(b);
    if (!currentRepo) return;
    setIsUpdating(true);
    try {
      const branchCommits = await fetchBranchCommits(currentRepo.owner.login, currentRepo.name, b.name, token);
      setCommits(branchCommits);
    } catch (err) {
      console.error('Failed fetching branch commits:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefreshCurrent = async () => {
    if (!currentRepo) return;
    setIsUpdating(true);
    try {
      await selectRepository(currentRepo, token);
    } finally {
      setIsUpdating(false);
    }
  };

  // Git Execution Handlers for Visual Workflow
  const handleExecuteCommit = async (msg: string) => {
    const newSha = Math.random().toString(16).substring(2, 9);
    const newCommit: Commit = {
      sha: newSha,
      commit: {
        author: {
          name: authUser?.name || 'Developer',
          email: 'dev@example.com',
          date: new Date().toISOString(),
        },
        message: msg,
      },
      author: {
        login: authUser?.login || 'developer',
        avatar_url: authUser?.avatar_url || '',
      },
      html_url: currentRepo ? `https://github.com/${currentRepo.full_name}/commit/${newSha}` : `https://github.com/commit/${newSha}`,
      stats: { additions: 120, deletions: 14, total: 134 },
    };

    setCommits((prev) => [newCommit, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'commit',
        author: { name: authUser?.name || 'Developer', avatar_url: authUser?.avatar_url },
        branch: selectedBranch?.name || currentRepo?.default_branch || 'main',
        message: msg,
        sha: newSha,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleExecuteStage = async () => {};

  const handleExecuteSwitchBranch = async (bName: string) => {
    const found = branches.find((b) => b.name === bName);
    if (found) {
      await handleSelectBranch(found);
    }
  };

  const handleOpenCommunityWorkflow = (wf: CommunityWorkflow) => {
    setSelectedCommunityWorkflow(wf);
    setActiveTab('visual');
  };

  const handleForkCommunityWorkflow = (wf: CommunityWorkflow) => {
    incrementForkCount(wf.id);
    const forked: CommunityWorkflow = {
      ...wf,
      id: `wf-fork-${Date.now()}`,
      title: `${wf.title} (Fork)`,
      forkedFrom: {
        workflowId: wf.id,
        title: wf.title,
        author: wf.author,
      },
    };
    setSelectedCommunityWorkflow(forked);
    setActiveTab('visual');
  };

  if (isLandingPage) {
    return (
      <LandingPage
        tokenConnected={Boolean(token)}
        onConnectGitHubToken={handleConnectToken}
        onStartOAuth={handleStartOAuth}
        onOpenWorkspace={() => setIsLandingPage(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      <TopBar
        currentRepo={currentRepo}
        onOpenRepoSelector={() => setActiveTab('repositories')}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isUpdating={isUpdating}
        onRefresh={handleRefreshCurrent}
        tokenConnected={Boolean(token)}
        onConnectTokenClick={() => setShowTokenModal(true)}
        onReturnHome={() => setIsLandingPage(true)}
      />

      <AppShell
        activeTab={activeTab}
        onTabChange={(t) => {
          setActiveTab(t);
          if (t === 'overview') setSelectedBranch(null);
        }}
        currentRepo={currentRepo}
        tokenConnected={Boolean(token)}
        onConnectTokenClick={() => setShowTokenModal(true)}
        authUser={authUser}
      >
        {activeTab === 'overview' && currentRepo && (
          <div className="space-y-8 animate-fade-in">
            <RepositoryHeader
              repo={currentRepo}
              onBackToRepos={() => setActiveTab('repositories')}
              isRefreshing={isUpdating}
              onRefresh={handleRefreshCurrent}
              branchCount={branches.length}
              commitCount={commits.length > 0 ? commits.length : (currentRepo.commits_count ?? 0)}
              contributorCount={currentRepo.contributors_count ?? 1}
              branches={branches}
              activities={activities}
              onOpenActivityView={() => setActiveTab('activity')}
            />

            {!selectedBranch ? (
              <BranchList
                branches={branches}
                selectedBranch={selectedBranch}
                onSelectBranch={handleSelectBranch}
                isLoading={isUpdating}
              />
            ) : (
              <CommitTimeline
                branch={selectedBranch}
                commits={commits}
                onBackToBranches={() => setSelectedBranch(null)}
                onSelectCommit={(c) => setSelectedCommit(c)}
                onCompareWithMain={() => setActiveTab('compare')}
                isRefreshing={isUpdating}
                onRefresh={handleRefreshCurrent}
              />
            )}
          </div>
        )}

        {/* TAB 2: GIT GRAPH */}
        {activeTab === 'graph' && (
          <div className="animate-fade-in">
            <GitGraphView
              branches={branches}
              commits={commits}
              owner={currentRepo?.owner.login}
              repo={currentRepo?.name}
              token={token}
            />
          </div>
        )}

        {/* TAB 3: VISUAL GIT WORKFLOW */}
        {activeTab === 'visual' && (
          <div className="animate-fade-in flex-1 h-full w-full min-h-0 flex flex-col">
            <VisualWorkflow
              currentBranchName={selectedBranch?.name || currentRepo?.default_branch || 'main'}
              branches={branches}
              commits={commits}
              repoFullName={currentRepo?.full_name}
              initialWorkflow={selectedCommunityWorkflow}
              authUser={authUser}
              onExecuteCommit={handleExecuteCommit}
              onExecuteStage={handleExecuteStage}
              onExecuteSwitchBranch={handleExecuteSwitchBranch}
              onOpenCommunity={() => setActiveTab('community')}
            />
          </div>
        )}

        {/* TAB 4: COMMUNITY WORKFLOW HUB */}
        {activeTab === 'community' && (
          <div className="animate-fade-in w-full">
            <CommunityHub
              token={token}
              onOpenWorkflowInCanvas={handleOpenCommunityWorkflow}
              onForkWorkflowToCanvas={handleForkCommunityWorkflow}
              onOpenPublishModal={() => setActiveTab('visual')}
              onOpenDiscussions={(wf) => setSelectedDiscussionsWorkflow(wf)}
            />
          </div>
        )}

        {activeTab === 'repositories' && (
          <div className="animate-fade-in">
            <RepositorySelector
              repositories={repositories}
              selectedRepo={currentRepo}
              onSelectRepo={(r) => {
                selectRepository(r, token);
                setActiveTab('overview');
              }}
              onFetchCustomRepo={handleFetchCustomRepo}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-fade-in">
            <ActivityFeed activities={activities} />
          </div>
        )}

        {activeTab === 'compare' && currentRepo && (
          <div className="animate-fade-in">
            <BranchCompare
              owner={currentRepo.owner.login}
              repoName={currentRepo.name}
              branches={branches}
              initialBaseBranch={currentRepo.default_branch || 'main'}
              initialHeadBranch={selectedBranch?.name || (branches.find((b) => b.name !== (currentRepo.default_branch || 'main'))?.name || currentRepo.default_branch || 'main')}
              token={token}
              onSelectCommit={(c) => setSelectedCommit(c)}
            />
          </div>
        )}
      </AppShell>

      <WorkflowDiscussions
        workflow={selectedDiscussionsWorkflow}
        onClose={() => setSelectedDiscussionsWorkflow(null)}
        authUser={authUser}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        branches={branches}
        commits={commits}
        onSelectBranch={(b) => {
          handleSelectBranch(b);
          setActiveTab('overview');
        }}
        onSelectCommit={(c) => setSelectedCommit(c)}
      />

      <CommitDetailDrawer
        commit={selectedCommit}
        onClose={() => setSelectedCommit(null)}
      />

      {showTokenModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowTokenModal(false)}
          >
            <div
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-apple-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">GitHub Authentication</h3>
                  <p className="text-xs text-neutral-500">Log in with GitHub OAuth or PAT</p>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full py-2.5"
                onClick={handleStartOAuth}
              >
                <Github className="w-4 h-4" />
                <span>Authorize with GitHub OAuth</span>
              </Button>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Or enter GitHub PAT Token
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {token && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setToken(null);
                      localStorage.removeItem('branchwatch_github_token');
                      document.cookie = 'branchwatch_token=; Max-Age=0; path=/;';
                      setShowTokenModal(false);
                      setIsLandingPage(true);
                    }}
                    className="text-rose-600 dark:text-rose-400 text-xs"
                  >
                    Disconnect Account
                  </Button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="ghost" onClick={() => setShowTokenModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (tokenInput.trim()) {
                        handleConnectToken(tokenInput.trim());
                        setShowTokenModal(false);
                      }
                    }}
                  >
                    Save PAT Token
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
