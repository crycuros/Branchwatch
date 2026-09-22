import { WorkflowNode, NodeConnection, NodeType, NODE_PORT_DEFINITIONS, WorkflowValidationIssue } from './workflowTypes';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  portInfo?: string;
}

// Strict typed port connection rules — based on output → input port types
export function validateConnection(
  fromNode: WorkflowNode,
  toNode: WorkflowNode,
  existingConnections: NodeConnection[]
): ValidationResult {
  // 1. Prevent self connection
  if (fromNode.id === toNode.id) {
    return { valid: false, reason: 'Cannot connect a node to itself' };
  }

  // 2. Prevent duplicate connection
  const exists = existingConnections.some(
    (conn) => conn.fromId === fromNode.id && conn.toId === toNode.id
  );
  if (exists) {
    return { valid: false, reason: 'Connection already exists between these nodes' };
  }

  // 3. Prevent reverse (cycle)
  const reverseExists = existingConnections.some(
    (conn) => conn.fromId === toNode.id && conn.toId === fromNode.id
  );
  if (reverseExists) {
    return { valid: false, reason: 'A reverse connection already exists — this would create a cycle' };
  }

  // 4. Typed port validation — output of fromNode must match input of toNode
  const fromDef = NODE_PORT_DEFINITIONS[fromNode.type];
  const toDef = NODE_PORT_DEFINITIONS[toNode.type];

  if (!fromDef || !toDef) {
    return { valid: false, reason: 'Unknown node type' };
  }

  // Push/Terminal nodes have no output
  const fromOutputType = fromNode.config.outputPortType || fromDef.output.type;
  const toInputType = toNode.config.inputPortType || toDef.input.type;

  if (fromOutputType === 'None') {
    return {
      valid: false,
      reason: `${fromNode.title} is a terminal node and cannot have outgoing connections`,
    };
  }

  // Nodes with no input accept nothing
  if (toInputType === 'None') {
    return {
      valid: false,
      reason: `${toNode.title} does not accept incoming connections`,
    };
  }

  // Allow compatible connections (e.g. CommitRef can directly connect to Push)
  const isCompatible =
    fromOutputType === toInputType ||
    (fromNode.type === 'commit' && toNode.type === 'push') ||
    fromOutputType === 'WorkingTreeChanges' && toInputType === 'StagedChanges';

  if (!isCompatible) {
    return {
      valid: false,
      reason: `❌ ${fromNode.title} outputs "${fromOutputType}" but ${toNode.title} requires "${toInputType}"`,
      portInfo: `Output: ${fromOutputType} → Input required: ${toInputType}`,
    };
  }

  return { valid: true, portInfo: `${fromOutputType} → ${toInputType}` };
}

// Pre-execution workflow graph validator
export function validateWorkflowGraph(
  nodes: WorkflowNode[],
  connections: NodeConnection[]
): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];

  // Must have at least 1 node
  if (nodes.length === 0) {
    issues.push({ type: 'error', message: 'No nodes on canvas — add at least a Working Tree and Stage node' });
    return issues;
  }

  // Check each connection is valid
  for (const conn of connections) {
    const from = nodes.find((n) => n.id === conn.fromId);
    const to = nodes.find((n) => n.id === conn.toId);
    if (!from || !to) {
      issues.push({ type: 'error', message: `Connection references a missing node` });
      continue;
    }
    const result = validateConnection(from, to, connections.filter((c) => c.id !== conn.id));
    if (!result.valid) {
      issues.push({ type: 'error', nodeId: from.id, message: result.reason || 'Invalid connection' });
    }
  }

  // Commit node without message
  const commitNodes = nodes.filter((n) => n.type === 'commit');
  for (const c of commitNodes) {
    if (!c.config.commitMessage?.trim()) {
      issues.push({ type: 'error', nodeId: c.id, message: `Commit node "${c.title}" has an empty commit message` });
    }
  }

  // Commit node without upstream Stage connection
  for (const c of commitNodes) {
    const hasStageInput = connections.some((conn) => {
      const from = nodes.find((n) => n.id === conn.fromId);
      return conn.toId === c.id && from?.type === 'stage';
    });
    if (!hasStageInput) {
      issues.push({ type: 'warning', nodeId: c.id, message: `Commit node "${c.title}" has no Stage node connected — no files will be staged` });
    }
  }

  // Push node without upstream Branch or Commit
  const pushNodes = nodes.filter((n) => n.type === 'push');
  for (const p of pushNodes) {
    const hasValidInput = connections.some((conn) => {
      const from = nodes.find((n) => n.id === conn.fromId);
      return conn.toId === p.id && (from?.type === 'branch' || from?.type === 'commit');
    });
    if (!hasValidInput) {
      issues.push({ type: 'error', nodeId: p.id, message: `Push node requires a Branch or Commit node as input` });
    }
  }

  // Working Tree with no outgoing connections — isolated node
  const wtNodes = nodes.filter((n) => n.type === 'working_tree');
  for (const wt of wtNodes) {
    const hasOutput = connections.some((c) => c.fromId === wt.id);
    if (!hasOutput) {
      issues.push({ type: 'warning', nodeId: wt.id, message: `Working Tree node is not connected — connect it to a Stage node` });
    }
  }

  return issues;
}
