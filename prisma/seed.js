/**
 * Prisma Seed Script — BranchWatch Official Templates
 * Categorized by Industry Scale & Workflow Types (Enterprise, Startup, Casual, etc.)
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
    id: 'template-enterprise-staging',
    title: 'Enterprise Multi-Tier Staging Pipeline',
    description: 'High-compliance pipeline for big tech and financial institutions: validates working tree, creates isolated release branch, stages verified changes, and stages upstream for QA staging.',
    category: 'enterprise',
    visibility: 'public',
    tags: JSON.stringify(['enterprise', 'compliance', 'multi-tier', 'banking', 'best-practices']),
    isFeatured: true,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-wt', type: 'working_tree', title: 'Security & Tree Check', x: 60, y: 180, status: 'ready', config: { filesChangedCount: 3, additions: 140, deletions: 12 } },
      { id: 'node-branch', type: 'branch', title: 'Create Release Branch', x: 340, y: 180, status: 'draft', config: { branchName: 'release/v2.4.0-staging' } },
      { id: 'node-stage', type: 'stage', title: 'Stage Production Code', x: 620, y: 180, status: 'draft', config: { selectedFiles: ['src/lib/auth.ts', 'src/app/api/'] } },
      { id: 'node-commit', type: 'commit', title: 'Signed Compliance Commit', x: 900, y: 180, status: 'draft', config: { commitMessage: 'chore(release): promote audited security release v2.4.0' } },
      { id: 'node-push', type: 'push', title: 'Push to Staging Remote', x: 1180, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'release/v2.4.0-staging' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-wt', toId: 'node-branch' },
      { id: 'c2', fromId: 'node-branch', toId: 'node-stage' },
      { id: 'c3', fromId: 'node-stage', toId: 'node-commit' },
      { id: 'c4', fromId: 'node-commit', toId: 'node-push' },
    ]),
  },
  {
    id: 'template-feature-branch',
    title: 'Startup Agile Sprint Feature Flow',
    description: 'Rapid, isolated feature development pipeline from local working changes to remote pull request staging for fast-shipping teams.',
    category: 'startup',
    visibility: 'public',
    tags: JSON.stringify(['startup', 'agile', 'feature-branch', 'fast-shipping', 'github']),
    isFeatured: true,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-wt', type: 'working_tree', title: 'Working Tree', x: 60, y: 180, status: 'ready', config: { filesChangedCount: 3, additions: 84, deletions: 12 } },
      { id: 'node-stage', type: 'stage', title: 'Stage Changes', x: 340, y: 180, status: 'draft', config: { selectedFiles: ['src/components/Canvas.tsx'] } },
      { id: 'node-commit', type: 'commit', title: 'Feature Commit', x: 620, y: 180, status: 'draft', config: { commitMessage: 'feat(ui): implement interactive workflow nodes' } },
      { id: 'node-branch', type: 'branch', title: 'Feature Branch', x: 900, y: 180, status: 'draft', config: { branchName: 'feature/canvas-engine' } },
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
    id: 'template-casual-quickpush',
    title: 'Casual & Solo Developer Linear Push',
    description: 'Minimal, zero-overhead pipeline for solo devs, side projects, and indie hackers. Stages modified files, generates atomic commit, and syncs directly to origin.',
    category: 'casual',
    visibility: 'public',
    tags: JSON.stringify(['casual', 'solo-dev', 'indie-hacker', 'side-project', 'minimal']),
    isFeatured: false,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-wt', type: 'working_tree', title: 'Inspect Code Edits', x: 60, y: 180, status: 'ready', config: { filesChangedCount: 2, additions: 25, deletions: 4 } },
      { id: 'node-stage', type: 'stage', title: 'Stage All Changes', x: 340, y: 180, status: 'draft', config: { selectedFiles: [] } },
      { id: 'node-commit', type: 'commit', title: 'Update Commit', x: 620, y: 180, status: 'draft', config: { commitMessage: 'chore: update page layout and styling' } },
      { id: 'node-push', type: 'push', title: 'Sync to Remote', x: 900, y: 180, status: 'draft', config: { remoteName: 'origin', branchName: 'main' } },
    ]),
    edges: JSON.stringify([
      { id: 'c1', fromId: 'node-wt', toId: 'node-stage' },
      { id: 'c2', fromId: 'node-stage', toId: 'node-commit' },
      { id: 'c3', fromId: 'node-commit', toId: 'node-push' },
    ]),
  },
  {
    id: 'template-hotfix',
    title: 'Emergency Hotfix & Zero-Downtime Patch',
    description: 'Fast-path pipeline to branch off main, apply a targeted bugfix, and push directly for emergency production CI deployment.',
    category: 'hotfix',
    visibility: 'public',
    tags: JSON.stringify(['hotfix', 'emergency', 'production', 'incident-response']),
    isFeatured: true,
    ...OFFICIAL_AUTHOR,
    starsCount: 0,
    forksCount: 0,
    usageCount: 0,
    nodes: JSON.stringify([
      { id: 'node-branch', type: 'branch', title: 'Hotfix Branch', x: 60, y: 180, status: 'ready', config: { branchName: 'hotfix/cookie-patch' } },
      { id: 'node-wt', type: 'working_tree', title: 'Working Tree', x: 340, y: 180, status: 'ready', config: { filesChangedCount: 1, additions: 4, deletions: 2 } },
      { id: 'node-stage', type: 'stage', title: 'Stage Fix Only', x: 620, y: 180, status: 'draft', config: { selectedFiles: ['src/app/api/auth/session/route.ts'] } },
      { id: 'node-commit', type: 'commit', title: 'Targeted Fix Commit', x: 900, y: 180, status: 'draft', config: { commitMessage: 'fix(auth): prevent session cookie expiry' } },
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
    tags: JSON.stringify(['opensource', 'fork', 'pull-request', 'github', 'community']),
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
    title: 'Monorepo Scoped Package Release',
    description: 'Scoped package release flow: stages specific workspace directory, generates tagged version commit, and pushes to remote.',
    category: 'monorepo',
    visibility: 'public',
    tags: JSON.stringify(['monorepo', 'pnpm', 'turborepo', 'release', 'enterprise']),
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
];

async function main() {
  console.log('Seeding industry-categorized BranchWatch official templates...');

  for (const template of TEMPLATES) {
    await prisma.communityWorkflow.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
    console.log(`  Updated: [${template.category.toUpperCase()}] ${template.title}`);
  }

  console.log(`Done. Seeded ${TEMPLATES.length} industry-tiered BranchWatch templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
