import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── GET /api/community/workflows ────────────────────────────────────────────
// Fetch all public workflows with optional filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'stars';

    const where: Record<string, unknown> = { visibility: 'public' };

    if (category !== 'all') {
      where.category = category;
    }

    if (search.trim()) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { authorLogin: { contains: search } },
        { authorName: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> =
      sort === 'stars'
        ? { starsCount: 'desc' }
        : sort === 'forks'
        ? { forksCount: 'desc' }
        : sort === 'used'
        ? { usageCount: 'desc' }
        : { createdAt: 'desc' };

    const workflows = await prisma.communityWorkflow.findMany({
      where,
      orderBy,
    });

    // Parse JSON string fields back to objects for the client
    const parsed = workflows.map(deserializeWorkflow);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[GET /api/community/workflows]', err);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

// ─── POST /api/community/workflows ───────────────────────────────────────────
// Publish a new workflow (requires x-user-login header from client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userLogin = request.headers.get('x-user-login') || 'anonymous';
    const userName = request.headers.get('x-user-name') || userLogin;
    const userAvatar = request.headers.get('x-user-avatar') || '';

    if (!body.title || !body.nodes) {
      return NextResponse.json({ error: 'title and nodes are required' }, { status: 400 });
    }

    const workflow = await prisma.communityWorkflow.create({
      data: {
        title: body.title,
        description: body.description || '',
        category: body.category || 'feature',
        visibility: body.visibility || 'public',
        tags: JSON.stringify(body.tags || []),
        nodes: JSON.stringify(body.nodes || []),
        edges: JSON.stringify(body.edges || []),
        authorLogin: userLogin,
        authorName: userName,
        authorAvatar: userAvatar,
        forkedFromId: body.forkedFromId || null,
        forkedFromTitle: body.forkedFromTitle || null,
        forkedFromLogin: body.forkedFromLogin || null,
      },
    });

    return NextResponse.json(deserializeWorkflow(workflow), { status: 201 });
  } catch (err) {
    console.error('[POST /api/community/workflows]', err);
    return NextResponse.json({ error: 'Failed to publish workflow' }, { status: 500 });
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

export function deserializeWorkflow(wf: Record<string, unknown>) {
  return {
    ...wf,
    tags: safeParseJSON(wf.tags as string, []),
    nodes: safeParseJSON(wf.nodes as string, []),
    edges: safeParseJSON(wf.edges as string, []),
    // Map DB fields to frontend CommunityWorkflow shape
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
