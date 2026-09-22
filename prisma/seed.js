/**
 * Prisma Seed Script — BranchWatch Official Templates
 * Run with: npx prisma db seed  OR  node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const OFFICIAL_AUTHOR = {
  authorLogin: 'branchwatch',
  authorName: 'BranchWatch',
  authorAvatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
};

const TEMPLATES = [
  {
    id: 'template-feature-branch',
    title: 'Feature Branch Workflow',
    description: 'Standard, isolated feature development pipeline from local working changes to remote pull request staging.',
    category: 'feature',
    visibility: 'public',
    tags: JSON.stringify(['git-flow', 'feature-branch', 'best-practices', 'github']),
    isFeatured: true,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-wt', type: 'working_tree', title: 'Working Tree', x: 60, y: 180, status: 'ready', config: { filesChangedCount: 3, additions: 84, deletions: 12 } },
      { id: 'node-stage', type: 'stage', title: 'Stage', x: 340, y: 180, status: 'draft', config: { selectedFiles: ['src/components/Canvas.tsx', 'src/lib/types.ts'] } },
      { id: 'node-commit', type: 'commit', title: 'Commit', x: 620, y: 180, status: 'draft', config: { commitMessage: 'feat: implement interactive node canvas' } },
      { id: 'node-branch', type: 'branch', title: 'Branch', x: 900, y: 180, status: 'draft', config: { branchName: 'feature/canvas-engine' } },
      { id: 'node-push', type: 'push', title: 'Push Upstream', x: 1180, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'feature/canvas-engine' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-wt', toId: 'node-stage' },
      { id: 'c2', fromId: 'node-stage', toId: 'node-commit' },
      { id: 'c3', fromId: 'node-commit', toId: 'node-branch' },
      { id: 'c4', fromId: 'node-branch', toId: 'node-push' },
    ]),
  },
  {
    id: 'template-hotfix',
    title: 'Hotfix & Emergency Patch',
    description: 'Fast-path pipeline to branch off main, apply a targeted bugfix, and push directly for emergency CI deployment.',
    category: 'hotfix',
    visibility: 'public',
    tags: JSON.stringify(['hotfix', 'emergency', 'production', 'patch']),
    isFeatured: true,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-branch', type: 'branch', title: 'Hotfix Branch', x: 60, y: 180, status: 'ready', config: { branchName: 'hotfix/cookie-patch' } },
      { id: 'node-wt', type: 'working_tree', title: 'Working Tree', x: 340, y: 180, status: 'ready', config: { filesChangedCount: 1, additions: 4, deletions: 2 } },
      { id: 'node-stage', type: 'stage', title: 'Stage', x: 620, y: 180, status: 'draft', config: { selectedFiles: ['src/app/api/auth/session/route.ts'] } },
      { id: 'node-commit', type: 'commit', title: 'Commit Fix', x: 900, y: 180, status: 'draft', config: { commitMessage: 'fix(auth): correct cookie maxAge handling' } },
      { id: 'node-push', type: 'push', title: 'Push Hotfix', x: 1180, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'hotfix/cookie-patch' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-branch', toId: 'node-wt' },
      { id: 'c2', fromId: 'node-wt', toId: 'node-stage' },
      { id: 'c3', fromId: 'node-stage', toId: 'node-commit' },
      { id: 'c4', fromId: 'node-commit', toId: 'node-push' },
    ]),
  },
  {
    id: 'template-opensource-pr',
    title: 'Open Source PR Contribution Flow',
    description: 'Clean workflow for pulling upstream updates into local fork, creating topic branch, and pushing for Pull Request submission.',
    category: 'opensource',
    visibility: 'public',
    tags: JSON.stringify(['opensource', 'fork', 'pull-request', 'github']),
    isFeatured: false,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-pull', type: 'pull', title: 'Sync Upstream', x: 60, y: 180, status: 'ready', config: { remoteName: 'upstream', branchName: 'main' } },
      { id: 'node-branch', type: 'branch', title: 'Topic Branch', x: 340, y: 180, status: 'draft', config: { branchName: 'contrib/theme-tokens' } },
      { id: 'node-stage', type: 'stage', title: 'Stage Changes', x: 620, y: 180, status: 'draft', config: { selectedFiles: ['README.md', 'src/theme.css'] } },
      { id: 'node-commit', type: 'commit', title: 'Descriptive Commit', x: 900, y: 180, status: 'draft', config: { commitMessage: 'docs(readme): clarify theme token overrides' } },
      { id: 'node-push', type: 'push', title: 'Push to Fork', x: 1180, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'contrib/theme-tokens' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-pull', toId: 'node-branch' },
      { id: 'c2', fromId: 'node-branch', toId: 'node-stage' },
      { id: 'c3', fromId: 'node-stage', toId: 'node-commit' },
      { id: 'c4', fromId: 'node-commit', toId: 'node-push' },
    ]),
  },
  {
    id: 'template-monorepo-release',
    title: 'Monorepo Package Release',
    description: 'Scoped package release flow: stages specific workspace directory, generates tagged version commit, and pushes to remote.',
    category: 'monorepo',
    visibility: 'public',
    tags: JSON.stringify(['monorepo', 'pnpm', 'turborepo', 'release']),
    isFeatured: false,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-wt', type: 'working_tree', title: 'Working Tree', x: 60, y: 180, status: 'ready', config: { filesChangedCount: 4, additions: 62, deletions: 8 } },
      { id: 'node-stage', type: 'stage', title: 'Stage Package', x: 340, y: 180, status: 'draft', config: { selectedFiles: ['packages/ui/package.json', 'packages/ui/src/index.ts'] } },
      { id: 'node-commit', type: 'commit', title: 'Version Commit', x: 620, y: 180, status: 'draft', config: { commitMessage: 'chore(release): @branchwatch/ui@1.4.0' } },
      { id: 'node-push', type: 'push', title: 'Push Release', x: 900, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'main' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-wt', toId: 'node-stage' },
      { id: 'c2', fromId: 'node-stage', toId: 'node-commit' },
      { id: 'c3', fromId: 'node-commit', toId: 'node-push' },
    ]),
  },
  {
    id: 'template-clean-rebase',
    title: 'Clean Rebase & Remote Sync',
    description: 'Pulls latest upstream commits and rebases feature branch to maintain a linear, bisect-friendly commit history.',
    category: 'basics',
    visibility: 'public',
    tags: JSON.stringify(['rebase', 'linear-history', 'sync', 'git-basics']),
    isFeatured: false,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-pull', type: 'pull', title: 'Fetch Remote', x: 60, y: 180, status: 'ready', config: { remoteName: 'origin', branchName: 'main' } },
      { id: 'node-branch', type: 'branch', title: 'Feature Branch', x: 340, y: 180, status: 'draft', config: { branchName: 'feature/auth-guard' } },
      { id: 'node-push', type: 'push', title: 'Force-with-lease Push', x: 620, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'feature/auth-guard' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-pull', toId: 'node-branch' },
      { id: 'c2', fromId: 'node-branch', toId: 'node-push' },
    ]),
  },
];

async function main() {
  console.log('Seeding BranchWatch official templates (0 stars, author: BranchWatch)...');

  for (const template of TEMPLATES) {
    await prisma.communityWorkflow.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
    console.log(`  Updated: ${template.title}`);
  }

  console.log(`Done. Seeded ${TEMPLATES.length} official BranchWatch templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
