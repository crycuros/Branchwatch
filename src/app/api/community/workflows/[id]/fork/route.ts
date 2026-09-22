import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deserializeWorkflow } from '@/lib/communitySerializer';

// ─── POST /api/community/workflows/[id]/fork ─────────────────────────────────
// Fork a workflow — creates a new copy in DB with attribution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userLogin = request.headers.get('x-user-login');
    const userName = request.headers.get('x-user-name') || userLogin || 'anonymous';
    const userAvatar = request.headers.get('x-user-avatar') || '';

    if (!userLogin) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const original = await prisma.communityWorkflow.findUnique({
      where: { id: params.id },
    });
    if (!original) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

    // Create the forked workflow
    const forked = await prisma.communityWorkflow.create({
      data: {
        title: `${original.title} (Fork)`,
        description: original.description,
        category: original.category,
        visibility: 'private', // Forks start as private — user can publish later
        tags: original.tags,
        nodes: original.nodes,
        edges: original.edges,
        authorLogin: userLogin,
        authorName: userName,
        authorAvatar: userAvatar,
        forkedFromId: original.id,
        forkedFromTitle: original.title,
        forkedFromLogin: original.authorLogin,
      },
    });

    // Record fork relationship
    await prisma.workflowFork.create({
      data: {
        originalId: original.id,
        forkedWorkflowId: forked.id,
        userLogin,
      },
    });

    // Increment original's fork count
    await prisma.communityWorkflow.update({
      where: { id: original.id },
      data: { forksCount: { increment: 1 } },
    });

    return NextResponse.json(deserializeWorkflow(forked as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('[POST /api/community/workflows/[id]/fork]', err);
    return NextResponse.json({ error: 'Failed to fork workflow' }, { status: 500 });
  }
}
