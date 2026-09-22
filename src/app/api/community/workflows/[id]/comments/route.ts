import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── GET /api/community/workflows/[id]/comments ──────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.workflowComment.findMany({
      where: { workflowId: params.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(comments);
  } catch (err) {
    console.error('[GET /api/community/workflows/[id]/comments]', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// ─── POST /api/community/workflows/[id]/comments ─────────────────────────────
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

    const body = await request.json();
    if (!body.body?.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const comment = await prisma.workflowComment.create({
      data: {
        workflowId: params.id,
        userLogin,
        userName,
        userAvatar,
        body: body.body.trim(),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error('[POST /api/community/workflows/[id]/comments]', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

// ─── DELETE /api/community/workflows/[id]/comments ───────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userLogin = request.headers.get('x-user-login');
    const { commentId } = await request.json();

    const comment = await prisma.workflowComment.findUnique({ where: { id: commentId } });
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (comment.userLogin !== userLogin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.workflowComment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/community/workflows/[id]/comments]', err);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
