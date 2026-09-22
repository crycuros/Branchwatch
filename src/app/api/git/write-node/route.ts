import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repoPath = process.cwd(), manifest } = body;

    if (!manifest || !manifest.id || !manifest.name) {
      return NextResponse.json({ error: 'Invalid manifest payload' }, { status: 400 });
    }

    if (!fs.existsSync(repoPath)) {
      return NextResponse.json({ error: 'Repository path not found' }, { status: 404 });
    }

    const targetDir = path.join(repoPath, '.branchwatch', 'nodes');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Sanitize filename
    const safeFilename = `${manifest.id.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`;
    const targetFile = path.join(targetDir, safeFilename);

    // Format manifest payload to Schema v1
    const fullManifest = {
      schemaVersion: 1,
      ...manifest,
      createdAt: manifest.createdAt || new Date().toISOString(),
    };

    fs.writeFileSync(targetFile, JSON.stringify(fullManifest, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      path: targetFile,
      relativePath: path.join('.branchwatch', 'nodes', safeFilename),
      manifest: fullManifest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to write node to workspace' }, { status: 500 });
  }
}
