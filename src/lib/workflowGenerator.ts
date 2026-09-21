import { WorkflowNode, NodeConnection } from './workflowTypes';
import { Commit, Branch } from './types';

export function buildNodesFromRepoData(
  currentBranchName: string,
  branches: Branch[],
  commits: Commit[]
): { nodes: WorkflowNode[]; connections: NodeConnection[] } {
  const nodes: WorkflowNode[] = [];
  const connections: NodeConnection[] = [];

  // Case 1: Empty Repository (0 branches or 0 commits on GitHub)
  if (commits.length === 0 && branches.length === 0) {
    // 1. Working Tree
    nodes.push({
      id: 'node-wt',
      type: 'working_tree',
      title: 'Working Tree',
      x: 60,
      y: 200,
      status: 'ready',
      config: {
        filesChangedCount: 0,
        additions: 0,
        deletions: 0,
      },
    });

    // 2. Stage
    nodes.push({
      id: 'node-stage',
      type: 'stage',
      title: 'Stage',
      x: 380,
      y: 200,
      status: 'draft',
      config: {
        selectedFiles: [],
      },
    });
    connections.push({ id: 'conn-wt-stage', fromId: 'node-wt', toId: 'node-stage' });

    // 3. Initial Commit node (Draft)
    nodes.push({
      id: 'node-commit-initial',
      type: 'commit',
      title: 'Initial Commit',
      x: 700,
      y: 200,
      status: 'draft',
      config: {
        commitMessage: 'Initial commit',
      },
    });
    connections.push({ id: 'conn-stage-initial', fromId: 'node-stage', toId: 'node-commit-initial' });

    // 4. Branch node (main)
    nodes.push({
      id: 'node-branch-main',
      type: 'branch',
      title: 'Branch',
      x: 1020,
      y: 200,
      status: 'draft',
      config: {
        branchName: currentBranchName || 'main',
      },
    });
    connections.push({ id: 'conn-commit-branch', fromId: 'node-commit-initial', toId: 'node-branch-main' });

    // 5. Push node (upstream setup)
    nodes.push({
      id: 'node-push-main',
      type: 'push',
      title: 'Push',
      x: 1340,
      y: 200,
      status: 'draft',
      config: {
        remoteName: 'origin',
        branchName: currentBranchName || 'main',
      },
    });
    connections.push({ id: 'conn-branch-push', fromId: 'node-branch-main', toId: 'node-push-main' });

    return { nodes, connections };
  }

  // Case 2: Repository with actual commits / branches
  const latestCommit = commits[0];
  const wtAdditions = latestCommit?.stats?.additions ?? 0;
  const wtDeletions = latestCommit?.stats?.deletions ?? 0;
  const wtFilesChanged = latestCommit?.files?.length ?? 0;

  // Node 1: Working Tree
  nodes.push({
    id: 'node-wt',
    type: 'working_tree',
    title: 'Working Tree',
    x: 60,
    y: 200,
    status: 'ready',
    config: {
      filesChangedCount: wtFilesChanged,
      additions: wtAdditions,
      deletions: wtDeletions,
    },
  });

  // Node 2: Stage
  const stagedFiles = latestCommit?.files?.map((f) => f.filename).slice(0, 5) ?? [];
  nodes.push({
    id: 'node-stage',
    type: 'stage',
    title: 'Stage',
    x: 380,
    y: 200,
    status: 'ready',
    config: {
      selectedFiles: stagedFiles,
    },
  });
  connections.push({ id: 'conn-wt-stage', fromId: 'node-wt', toId: 'node-stage' });

  // Node 3+: Real Commit nodes from GitHub commit history
  const commitSlice = commits.slice(0, 3);
  let previousNodeId = 'node-stage';

  commitSlice.forEach((c, idx) => {
    const nodeId = `node-commit-${c.sha.substring(0, 7)}`;
    nodes.push({
      id: nodeId,
      type: 'commit',
      title: `Commit`,
      x: 700 + idx * 320,
      y: 200,
      status: 'success',
      config: {
        sha: c.sha.substring(0, 7),
        commitMessage: c.commit.message.split('\n')[0].substring(0, 72),
        committedAt: c.commit.author?.date,
        additions: c.stats?.additions ?? 0,
        deletions: c.stats?.deletions ?? 0,
        filesChangedCount: c.files?.length ?? 0,
        authorName: c.commit.author?.name,
        commitUrl: c.html_url,
      },
    });

    connections.push({
      id: `conn-${previousNodeId}-${nodeId}`,
      fromId: previousNodeId,
      toId: nodeId,
    });

    previousNodeId = nodeId;
  });

  // Node 4+: Branch nodes
  const activeBranch = branches.find((b) => b.name === currentBranchName) || branches[0];
  const otherBranches = branches
    .filter((b) => b.name !== activeBranch?.name)
    .slice(0, 2);
  const displayBranches = activeBranch ? [activeBranch, ...otherBranches] : branches.slice(0, 3);

  const commitAnchorId = commitSlice.length > 0
    ? `node-commit-${commitSlice[0].sha.substring(0, 7)}`
    : previousNodeId;

  displayBranches.forEach((b, idx) => {
    const branchId = `node-branch-${b.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    nodes.push({
      id: branchId,
      type: 'branch',
      title: `Branch`,
      x: 700 + idx * 300,
      y: idx === 0 ? 40 : 380,
      status: b.name === currentBranchName ? 'success' : 'draft',
      config: {
        branchName: b.name,
        sha: b.commit.sha.substring(0, 7),
      },
    });

    connections.push({
      id: `conn-${commitAnchorId}-${branchId}`,
      fromId: commitAnchorId,
      toId: branchId,
    });
  });

  return { nodes, connections };
}

export function generateGitCommands(nodes: WorkflowNode[], connections: NodeConnection[]): string[] {
  const commands: string[] = ['$ git status'];

  nodes.forEach((node) => {
    switch (node.type) {
      case 'stage':
        if (node.config.selectedFiles && node.config.selectedFiles.length > 0) {
          commands.push(`$ git add ${node.config.selectedFiles.join(' ')}`);
        } else {
          commands.push('$ git add .');
        }
        break;
      case 'commit': {
        const msg = node.config.commitMessage?.trim() || 'Update features';
        commands.push(`$ git commit -m "${msg}"`);
        break;
      }
      case 'branch': {
        const bName = node.config.branchName || 'main';
        commands.push(`$ git switch ${bName}`);
        break;
      }
      case 'pull': {
        const pRemote = node.config.remoteName || 'origin';
        const pBranch = node.config.branchName || 'main';
        commands.push(`$ git pull ${pRemote} ${pBranch}`);
        break;
      }
      case 'push': {
        const pushRemote = node.config.remoteName || 'origin';
        const pushBranch = node.config.branchName || 'HEAD';
        commands.push(`$ git push ${pushRemote} ${pushBranch}`);
        break;
      }
    }
  });

  return commands;
}
