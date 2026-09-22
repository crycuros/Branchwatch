import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deserializeWorkflow } from '../route';

// ─── GET /api/community/workflows/[id] ───────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wf = await prisma.communityWorkflow.findUnique({
      where: { id: params.id },
    });
    if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Increment usage count on open
    await prisma.communityWorkflow.update({
      where: { id: params.id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json(deserializeWorkflow(wf as Record<string, unknown>));
  } catch (err) {
    console.error('[GET /api/community/workflows/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

// ─── DELETE /api/community/workflows/[id] ────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userLogin = request.headers.get('x-user-login');
    const wf = await prisma.communityWorkflow.findUnique({ where: { id: params.id } });

    if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (wf.authorLogin !== userLogin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.communityWorkflow.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/community/workflows/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
