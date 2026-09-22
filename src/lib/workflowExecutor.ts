import {
  WorkflowNode,
  NodeConnection,
  ExecutionStep,
  NodeType,
  WorkflowExecutionEvent,
  NodeCondition,
} from './workflowTypes';

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
    case 'plugin': {
      if (node.config.runtime === 'webhook') {
        command = `DISPATCH HTTP ${node.config.webhookConfig?.method || 'POST'} ${node.config.webhookConfig?.url || ''}`;
        description = `Dispatch webhook notification: ${node.title}`;
      } else {
        let tpl = node.config.scriptContent || node.config.commandTemplate || 'git status';
        const params = node.config.customParams || {};

        // Handle {{#if key}}...{{/if}}
        tpl = tpl.replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/g, (_, key, inner) => {
          return params[key] ? inner : '';
        });

        // Handle variables {{key}}
        tpl = tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
          if (key === 'branch' || key === 'branchName' || key === 'BRANCH') return node.config.branchName || 'main';
          if (params[key] !== undefined) return String(params[key]);
          return '';
        });

        command = tpl.trim();
        description = `Execute custom node (${node.config.runtime || 'shell'}): ${node.title}`;
      }
      break;
    }
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

// Evaluate condition before node execution
export function evaluateCondition(
  condition: NodeCondition | undefined,
  contextMap: Record<string, { outputs?: Record<string, any>; status?: string }>
): boolean {
  if (!condition || !condition.sourceNodeId) return true;

  const sourceContext = contextMap[condition.sourceNodeId];
  if (!sourceContext) return false;

  const actualValue = sourceContext.outputs?.[condition.field] ?? (condition.field === 'status' ? sourceContext.status : undefined);

  switch (condition.operator) {
    case 'equals':
      return String(actualValue) === String(condition.value);
    case 'not_equals':
      return String(actualValue) !== String(condition.value);
    case 'greater_than':
      return Number(actualValue) > Number(condition.value);
    case 'less_than':
      return Number(actualValue) < Number(condition.value);
    case 'contains':
      return String(actualValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'is_truthy':
      return Boolean(actualValue);
    default:
      return true;
  }
}

// Execute step with real backend runner or simulation
export async function executeStep(
  step: ExecutionStep,
  node: WorkflowNode,
  repoContext: {
    repoPath?: string;
    branch?: string;
    baseBranch?: string;
    ahead?: number;
    behind?: number;
    committedFiles?: any[];
    contextOutputs?: Record<string, any>;
  },
  onStatusChange: (
    nodeId: string,
    status: WorkflowNode['status'],
    output?: string,
    sha?: string,
    outputs?: Record<string, any>
  ) => void,
  onEvent?: (event: WorkflowExecutionEvent) => void
): Promise<ExecutionStep> {
  onStatusChange(step.nodeId, 'executing');

  const now = new Date().toISOString();
  onEvent?.({
    type: 'start',
    nodeId: step.nodeId,
    nodeTitle: step.nodeTitle,
    data: step.command,
    timestamp: now,
  });

  const startTime = Date.now();

  // If node is a custom script / webhook plugin, call the backend execution API
  if (node.type === 'plugin') {
    try {
      const res = await fetch('/api/workflow/run-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          nodeTitle: node.title,
          runtime: node.config.runtime || 'shell',
          command: node.config.commandTemplate,
          scriptContent: node.config.scriptContent,
          repoPath: repoContext.repoPath,
          timeoutMs: node.config.timeoutMs || 30000,
          inputs: node.config.customParams,
          webhookConfig: node.config.webhookConfig,
          context: {
            branch: repoContext.branch || node.config.branchName,
            baseBranch: repoContext.baseBranch,
            ahead: repoContext.ahead,
            behind: repoContext.behind,
            committedFiles: repoContext.committedFiles,
            upstreamOutputs: repoContext.contextOutputs,
          },
        }),
      });

      const data = await res.json();
      const durationMs = Date.now() - startTime;

      if (node.config.runtime === 'webhook') {
        onEvent?.({
          type: 'http_response',
          nodeId: node.id,
          nodeTitle: node.title,
          data: data.stdout || data.stderr,
          timestamp: new Date().toISOString(),
          status: data.status,
          durationMs,
          outputs: data.outputs,
        });
      } else {
        if (data.stdout) {
          onEvent?.({
            type: 'stdout',
            nodeId: node.id,
            nodeTitle: node.title,
            data: data.stdout,
            timestamp: new Date().toISOString(),
          });
        }
        if (data.stderr) {
          onEvent?.({
            type: 'stderr',
            nodeId: node.id,
            nodeTitle: node.title,
            data: data.stderr,
            timestamp: new Date().toISOString(),
          });
        }

        onEvent?.({
          type: 'exit',
          nodeId: node.id,
          nodeTitle: node.title,
          data: data.success ? 'Success' : 'Failed',
          timestamp: new Date().toISOString(),
          exitCode: data.exitCode,
          durationMs,
          outputs: data.outputs,
        });
      }

      const finalStatus = data.success ? 'success' : 'failed';
      onStatusChange(
        step.nodeId,
        finalStatus,
        data.stdout || data.stderr,
        undefined,
        data.outputs
      );

      return {
        ...step,
        status: finalStatus,
        output: data.stdout,
        error: data.stderr,
        exitCode: data.exitCode,
        durationMs,
        outputs: data.outputs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      onEvent?.({
        type: 'error',
        nodeId: node.id,
        nodeTitle: node.title,
        data: err.message || 'Execution error',
        timestamp: new Date().toISOString(),
        durationMs,
      });

      onStatusChange(step.nodeId, 'failed', err.message);
      return {
        ...step,
        status: 'failed',
        error: err.message,
        durationMs,
      };
    }
  }

  // Built-in Git nodes simulation/execution
  const delay = 500 + Math.random() * 500;
  await new Promise((r) => setTimeout(r, delay));
  const durationMs = Math.round(Date.now() - startTime);

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

  onEvent?.({
    type: 'stdout',
    nodeId: step.nodeId,
    nodeTitle: step.nodeTitle,
    data: output,
    timestamp: new Date().toISOString(),
  });

  onEvent?.({
    type: 'exit',
    nodeId: step.nodeId,
    nodeTitle: step.nodeTitle,
    data: 'Success',
    timestamp: new Date().toISOString(),
    exitCode: 0,
    durationMs,
  });

  onStatusChange(step.nodeId, 'success', output, sha);

  return {
    ...step,
    status: 'success',
    output,
    durationMs,
  };
}
