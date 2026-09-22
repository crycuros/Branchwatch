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

  // 1. Working Tree
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

  // 2. Stage
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

  // 3. Active Commit Node
  const commitId = latestCommit ? `node-commit-${latestCommit.sha.substring(0, 7)}` : 'node-commit-active';
  nodes.push({
    id: commitId,
    type: 'commit',
    title: 'Commit',
    x: 700,
    y: 200,
    status: latestCommit ? 'ready' : 'draft',
    config: {
      sha: latestCommit ? latestCommit.sha.substring(0, 7) : undefined,
      commitMessage: latestCommit ? latestCommit.commit.message.split('\n')[0].substring(0, 72) : 'feat: commit changes',
      committedAt: latestCommit?.commit.author?.date,
      additions: latestCommit?.stats?.additions ?? 0,
      deletions: latestCommit?.stats?.deletions ?? 0,
      filesChangedCount: latestCommit?.files?.length ?? 0,
      authorName: latestCommit?.commit.author?.name,
      commitUrl: latestCommit?.html_url,
    },
  });
  connections.push({ id: `conn-stage-commit`, fromId: 'node-stage', toId: commitId });

  // 4. Branch Nodes (Display Active Branch + Default/Secondary Branch if available)
  const activeBranch = branches.find((b) => b.name === currentBranchName) || branches[0];
  const activeBranchName = activeBranch?.name || currentBranchName || 'main';
  const secondaryBranch = branches.find((b) => b.name !== activeBranchName);

  if (secondaryBranch) {
    // 4a. Top Track: Active working branch
    const branch1Id = `node-branch-${activeBranchName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    nodes.push({
      id: branch1Id,
      type: 'branch',
      title: 'Branch (Active)',
      x: 1020,
      y: 120,
      status: 'ready',
      config: {
        branchName: activeBranchName,
        sha: activeBranch?.commit?.sha?.substring(0, 7),
      },
    });
    connections.push({ id: `conn-commit-${branch1Id}`, fromId: commitId, toId: branch1Id });

    const push1Id = `node-push-${activeBranchName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    nodes.push({
      id: push1Id,
      type: 'push',
      title: 'Push',
      x: 1340,
      y: 120,
      status: 'draft',
      config: {
        remoteName: 'origin',
        branchName: activeBranchName,
      },
    });
    connections.push({ id: `conn-branch-${push1Id}`, fromId: branch1Id, toId: push1Id });

    // 4b. Bottom Track: Base / Default branch (e.g. main)
    const branch2Name = secondaryBranch.name;
    const branch2Id = `node-branch-${branch2Name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    nodes.push({
      id: branch2Id,
      type: 'branch',
      title: 'Branch',
      x: 1020,
      y: 340,
      status: 'ready',
      config: {
        branchName: branch2Name,
        sha: secondaryBranch?.commit?.sha?.substring(0, 7),
      },
    });
    connections.push({ id: `conn-commit-${branch2Id}`, fromId: commitId, toId: branch2Id });

    const push2Id = `node-push-${branch2Name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    nodes.push({
      id: push2Id,
      type: 'push',
      title: 'Push',
      x: 1340,
      y: 340,
      status: 'draft',
      config: {
        remoteName: 'origin',
        branchName: branch2Name,
      },
    });
    connections.push({ id: `conn-branch-${push2Id}`, fromId: branch2Id, toId: push2Id });
  } else {
    // Single Branch Fallback
    const branchId = `node-branch-${activeBranchName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    nodes.push({
      id: branchId,
      type: 'branch',
      title: 'Branch',
      x: 1020,
      y: 200,
      status: 'ready',
      config: {
        branchName: activeBranchName,
        sha: activeBranch?.commit?.sha?.substring(0, 7),
      },
    });
    connections.push({ id: `conn-commit-branch`, fromId: commitId, toId: branchId });

    const pushId = 'node-push-active';
    nodes.push({
      id: pushId,
      type: 'push',
      title: 'Push',
      x: 1340,
      y: 200,
      status: 'draft',
      config: {
        remoteName: 'origin',
        branchName: activeBranchName,
      },
    });
    connections.push({ id: `conn-branch-push`, fromId: branchId, toId: pushId });
  }

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
