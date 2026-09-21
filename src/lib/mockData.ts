import { Repository, Branch, Commit, BranchComparison, ActivityItem } from './types';

// Standard demo repositories
export const MOCK_REPOSITORIES: Repository[] = [
  {
    id: 101,
    name: 'Campus-Debugger',
    full_name: 'crycuros/Campus-Debugger',
    owner: {
      login: 'crycuros',
      avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
    },
    private: false,
    description: 'Interactive unity-based campus navigation & debugging suite',
    html_url: 'https://github.com/crycuros/Campus-Debugger',
    default_branch: 'main',
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
    stargazers_count: 142,
    forks_count: 28,
    open_issues_count: 4,
    branches_count: 8,
    commits_count: 391,
    contributors_count: 3,
  },
  {
    id: 102,
    name: 'Portfolio',
    full_name: 'crycuros/Portfolio',
    owner: {
      login: 'crycuros',
      avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
    },
    private: false,
    description: 'Personal portfolio & engineering projects showcase',
    html_url: 'https://github.com/crycuros/Portfolio',
    default_branch: 'main',
    updated_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(), // 42 mins ago
    stargazers_count: 89,
    forks_count: 12,
    open_issues_count: 1,
    branches_count: 12,
    commits_count: 248,
    contributors_count: 2,
  },
  {
    id: 103,
    name: 'react',
    full_name: 'facebook/react',
    owner: {
      login: 'facebook',
      avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4',
    },
    private: false,
    description: 'The library for web and native user interfaces.',
    html_url: 'https://github.com/facebook/react',
    default_branch: 'main',
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stargazers_count: 228000,
    forks_count: 46000,
    open_issues_count: 1200,
    branches_count: 45,
    commits_count: 16400,
    contributors_count: 1600,
  }
];

export const MOCK_BRANCHES: Record<string, Branch[]> = {
  'crycuros/Campus-Debugger': [
    {
      name: 'main',
      commit: { sha: 'a81c92f', url: '' },
      protected: true,
      lastCommitDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
      lastCommitMessage: 'Update core rendering engine and fix build warnings',
      lastCommitAuthor: { name: 'Giane Pinlac', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      commitCount: 42,
      status: 'active',
    },
    {
      name: 'feature/game-ui',
      commit: { sha: '7b91d4e', url: '' },
      protected: false,
      lastCommitDate: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8m ago
      lastCommitMessage: 'Fix button hover states and scale transitions',
      lastCommitAuthor: { name: 'Richard Miranda', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
      commitCount: 31,
      status: 'active',
    },
    {
      name: 'feature/login',
      commit: { sha: 'e3f012c', url: '' },
      protected: false,
      lastCommitDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15m ago
      lastCommitMessage: 'Add OAuth callback handler and session persist',
      lastCommitAuthor: { name: 'Richard Miranda', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
      commitCount: 17,
      status: 'active',
    },
    {
      name: 'fix/audio',
      commit: { sha: '3c82fa1', url: '' },
      protected: false,
      lastCommitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2d ago
      lastCommitMessage: 'Fix spatial audio attenuation range on distance clip',
      lastCommitAuthor: { name: 'Giane Pinlac', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      commitCount: 9,
      status: 'quiet',
    },
    {
      name: 'testing',
      commit: { sha: '990ab12', url: '' },
      protected: false,
      lastCommitDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18d ago
      lastCommitMessage: 'Experimental shader pipeline prototype',
      lastCommitAuthor: { name: 'Richard Miranda', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
      commitCount: 3,
      status: 'stale',
    }
  ]
};

export const MOCK_COMMITS: Record<string, Commit[]> = {
  'feature/game-ui': [
    {
      sha: 'a81c92f',
      commit: {
        author: {
          name: 'Richard Miranda',
          email: 'richard@example.com',
          date: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
        },
        message: 'Fix button hover states and smooth scale transition',
      },
      author: {
        login: 'richardmiranda',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      },
      html_url: 'https://github.com/crycuros/Campus-Debugger/commit/a81c92f',
      stats: { additions: 182, deletions: 47, total: 229 },
      files: [
        { filename: 'Assets/UI/PlayButton.cs', status: 'modified', additions: 84, deletions: 12, changes: 96 },
        { filename: 'Assets/UI/MenuController.cs', status: 'modified', additions: 62, deletions: 25, changes: 87 },
        { filename: 'Scenes/MainMenu.unity', status: 'modified', additions: 36, deletions: 10, changes: 46 }
      ]
    },
    {
      sha: 'b490e11',
      commit: {
        author: {
          name: 'Richard Miranda',
          email: 'richard@example.com',
          date: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
        },
        message: 'Add dialogue system modal with typing animation effect',
      },
      author: {
        login: 'richardmiranda',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      },
      html_url: 'https://github.com/crycuros/Campus-Debugger/commit/b490e11',
      stats: { additions: 340, deletions: 12, total: 352 },
      files: [
        { filename: 'Assets/Scripts/DialogueSystem.cs', status: 'added', additions: 240, deletions: 0, changes: 240 },
        { filename: 'Assets/UI/DialogueBox.prefab', status: 'added', additions: 100, deletions: 12, changes: 112 }
      ]
    },
    {
      sha: 'c9120af',
      commit: {
        author: {
          name: 'Richard Miranda',
          email: 'richard@example.com',
          date: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
        },
        message: 'Add player movement inertia damping and rotation smoothing',
      },
      author: {
        login: 'richardmiranda',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      },
      html_url: 'https://github.com/crycuros/Campus-Debugger/commit/c9120af',
      stats: { additions: 142, deletions: 89, total: 231 },
      files: [
        { filename: 'Assets/Scripts/PlayerController.cs', status: 'modified', additions: 142, deletions: 89, changes: 231 }
      ]
    },
    {
      sha: 'd1029ba',
      commit: {
        author: {
          name: 'Richard Miranda',
          email: 'richard@example.com',
          date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // Yesterday
        },
        message: 'Create inventory grid system with drag-and-drop slots',
      },
      author: {
        login: 'richardmiranda',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      },
      html_url: 'https://github.com/crycuros/Campus-Debugger/commit/d1029ba',
      stats: { additions: 540, deletions: 233, total: 773 },
      files: [
        { filename: 'Assets/UI/InventoryGrid.cs', status: 'added', additions: 320, deletions: 0, changes: 320 },
        { filename: 'Assets/UI/ItemSlot.cs', status: 'added', additions: 220, deletions: 0, changes: 220 }
      ]
    }
  ],
  'main': [
    {
      sha: 'f9011ab',
      commit: {
        author: {
          name: 'Giane Pinlac',
          email: 'giane@example.com',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        },
        message: 'Update core rendering engine and fix build warnings',
      },
      author: {
        login: 'gianepinlac',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      },
      html_url: 'https://github.com/crycuros/Campus-Debugger/commit/f9011ab',
      stats: { additions: 98, deletions: 14, total: 112 },
      files: [
        { filename: 'Engine/RenderPipeline.cs', status: 'modified', additions: 98, deletions: 14, changes: 112 }
      ]
    }
  ]
};

export const MOCK_COMPARISON: BranchComparison = {
  baseBranch: 'main',
  headBranch: 'feature/game-ui',
  ahead_by: 18,
  behind_by: 2,
  total_commits: 18,
  stats: {
    additions: 1204,
    deletions: 381,
    total_files: 12,
  },
  commits: MOCK_COMMITS['feature/game-ui'],
  files: [
    { filename: 'Assets/UI/PlayButton.cs', status: 'modified', additions: 84, deletions: 12, changes: 96 },
    { filename: 'Assets/UI/MenuController.cs', status: 'modified', additions: 62, deletions: 25, changes: 87 },
    { filename: 'Assets/Scripts/DialogueSystem.cs', status: 'added', additions: 240, deletions: 0, changes: 240 },
    { filename: 'Assets/UI/InventoryGrid.cs', status: 'added', additions: 320, deletions: 0, changes: 320 },
    { filename: 'Assets/UI/ItemSlot.cs', status: 'added', additions: 220, deletions: 0, changes: 220 },
    { filename: 'Scenes/MainMenu.unity', status: 'modified', additions: 278, deletions: 344, changes: 622 }
  ]
};

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'commit',
    author: { name: 'Richard Miranda', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    branch: 'feature/game-ui',
    message: 'Fix button hover states and scale transitions',
    sha: 'a81c92f',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    type: 'commit',
    author: { name: 'Richard Miranda', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    branch: 'feature/login',
    message: 'Add OAuth callback handler and session persist',
    sha: 'e3f012c',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    type: 'commit',
    author: { name: 'Giane Pinlac', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    branch: 'main',
    message: 'Update core rendering engine and fix build warnings',
    sha: 'f9011ab',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    type: 'commit',
    author: { name: 'Richard Miranda', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    branch: 'feature/game-ui',
    message: 'Add dialogue system modal with typing animation effect',
    sha: 'b490e11',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-5',
    type: 'branch_created',
    author: { name: 'Giane Pinlac', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    branch: 'fix/audio',
    message: 'Created branch fix/audio from main',
    sha: '3c82fa1',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];
