import { WorkflowNode, NodeConnection, ExecutionStep, NodeType } from './workflowTypes';

const DANGEROUS_NODE_TYPES: NodeType[] = ['push'];

// Build topologically-ordered execution plan from the graph
export function generateExecutionPlan(
  nodes: WorkflowNode[],
  connections: NodeConnection[]
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const visited = new Set<string>();

  // Topological sort: start from nodes with no incoming connections
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => (inDegree[n.id] = 0));
  connections.forEach((c) => {
    if (inDegree[c.toId] !== undefined) inDegree[c.toId]++;
  });

  const queue = nodes.filter((n) => inDegree[n.id] === 0).sort((a, b) => a.x - b.x);

  const processNode = (node: WorkflowNode) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const step = buildStepForNode(node);
    if (step) steps.push(step);

    // Process children
    const children = connections
      .filter((c) => c.fromId === node.id)
      .map((c) => nodes.find((n) => n.id === c.toId))
      .filter(Boolean) as WorkflowNode[];

    children.sort((a, b) => a.x - b.x).forEach(processNode);
  };

  queue.forEach(processNode);
  // Catch any disconnected nodes
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const step = buildStepForNode(n);
      if (step) steps.push(step);
    }
  });

  return steps;
}

function buildStepForNode(node: WorkflowNode): ExecutionStep | null {
  let command = '';
  let description = '';

  switch (node.type) {
    case 'working_tree':
      command = 'git status';
      description = 'Check current working tree status';
      break;
    case 'stage':
      if (node.config.selectedFiles && node.config.selectedFiles.length > 0) {
        command = `git add ${node.config.selectedFiles.join(' ')}`;
        description = `Stage ${node.config.selectedFiles.length} selected files`;
      } else {
        command = 'git add .';
        description = 'Stage all changes in working tree';
      }
      break;
    case 'commit':
      if (!node.config.commitMessage?.trim()) return null;
      command = `git commit -m "${node.config.commitMessage.trim()}"`;
      description = `Commit staged changes with message`;
      break;
    case 'branch':
      command = `git switch ${node.config.branchName || 'main'}`;
      description = `Switch to branch ${node.config.branchName || 'main'}`;
      break;
    case 'pull':
      command = `git pull ${node.config.remoteName || 'origin'} ${node.config.branchName || 'main'}`;
      description = `Pull latest changes from remote`;
      break;
    case 'push':
      command = `git push ${node.config.remoteName || 'origin'} ${node.config.branchName || 'HEAD'}`;
      description = `Push local commits to remote`;
      break;
    default:
      return null;
  }

  return {
    nodeId: node.id,
    nodeTitle: node.title,
    nodeType: node.type,
    command,
    description,
    isDangerous: DANGEROUS_NODE_TYPES.includes(node.type),
    status: 'queued',
  };
}

// Simulate step-by-step execution with realistic delays
export async function executeStep(
  step: ExecutionStep,
  onStatusChange: (nodeId: string, status: WorkflowNode['status'], output?: string, sha?: string) => void
): Promise<ExecutionStep> {
  onStatusChange(step.nodeId, 'executing');

  const startedAt = new Date().toISOString();
  const delay = 600 + Math.random() * 800;

  await new Promise((r) => setTimeout(r, delay));

  const completedAt = new Date().toISOString();
  const durationMs = Math.round(delay);

  // Simulate realistic terminal output per node type
  let output = '';
  let sha: string | undefined;

  switch (step.nodeType) {
    case 'working_tree':
      output = `On branch HEAD\nStatus: working tree clean / synchronized`;
      break;
    case 'stage':
      output = `${step.command}\nChanges staged for commit`;
      break;
    case 'commit': {
      sha = Math.random().toString(16).substring(2, 9);
      const msg = step.command.match(/-m "(.+)"/)?.[1] || 'Commit changes';
      output = `[${sha}] ${msg}\n 1 file changed, 1 insertion(+)`;
      break;
    }
    case 'branch':
      output = `Switched to branch '${step.command.split(' ').pop()}'`;
      break;
    case 'pull':
      output = `From remote\nFast-forward\nAlready up to date.`;
      break;
    case 'push':
      output = `Enumerating objects: 3, done.\nCounting objects: 100% (3/3), done.\nTo remote repository\n   Updates pushed successfully.`;
      break;
  }

  onStatusChange(step.nodeId, 'success', output, sha);

  return {
    ...step,
    status: 'success',
    output,
  };
}
