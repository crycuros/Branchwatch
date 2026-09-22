// Helper to convert database representation to client-friendly format

export function deserializeWorkflow(wf: Record<string, unknown>) {
  return {
    ...wf,
    tags: safeParseJSON(wf.tags as string, []),
    nodes: safeParseJSON(wf.nodes as string, []),
    edges: safeParseJSON(wf.edges as string, []),
    author: {
      login: wf.authorLogin,
      name: wf.authorName,
      avatar_url: wf.authorAvatar,
    },
    connections: safeParseJSON(wf.edges as string, []),
    forkedFrom: wf.forkedFromId
      ? {
          workflowId: wf.forkedFromId,
          title: wf.forkedFromTitle,
          author: { login: wf.forkedFromLogin },
        }
      : null,
  };
}

function safeParseJSON(str: string, fallback: unknown) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
