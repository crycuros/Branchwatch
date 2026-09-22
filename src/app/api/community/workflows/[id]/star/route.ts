import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── POST /api/community/workflows/[id]/star ─────────────────────────────────
// Toggle star for the authenticated user. Returns { starred: boolean, starsCount: number }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userLogin = request.headers.get('x-user-login');
    if (!userLogin) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const workflowId = params.id;

    // Check if already starred
    const existing = await prisma.workflowStar.findUnique({
      where: { workflowId_userLogin: { workflowId, userLogin } },
    });

    let starred: boolean;

    if (existing) {
      // Unstar
      await prisma.workflowStar.delete({
        where: { workflowId_userLogin: { workflowId, userLogin } },
      });
      await prisma.communityWorkflow.update({
        where: { id: workflowId },
        data: { starsCount: { decrement: 1 } },
      });
      starred = false;
    } else {
      // Star
      await prisma.workflowStar.create({
        data: { workflowId, userLogin },
      });
      await prisma.communityWorkflow.update({
        where: { id: workflowId },
        data: { starsCount: { increment: 1 } },
      });
      starred = true;
    }

    const updated = await prisma.communityWorkflow.findUnique({
      where: { id: workflowId },
      select: { starsCount: true },
    });

    return NextResponse.json({ starred, starsCount: updated?.starsCount ?? 0 });
  } catch (err) {
    console.error('[POST /api/community/workflows/[id]/star]', err);
    return NextResponse.json({ error: 'Failed to toggle star' }, { status: 500 });
  }
}

// ─── GET /api/community/workflows/[id]/star ──────────────────────────────────
// Check if user has starred this workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userLogin = request.headers.get('x-user-login');
    if (!userLogin) return NextResponse.json({ starred: false });

    const existing = await prisma.workflowStar.findUnique({
      where: { workflowId_userLogin: { workflowId: params.id, userLogin } },
    });

    return NextResponse.json({ starred: !!existing });
  } catch (err) {
    console.error('[GET /api/community/workflows/[id]/star]', err);
    return NextResponse.json({ starred: false });
  }
}
