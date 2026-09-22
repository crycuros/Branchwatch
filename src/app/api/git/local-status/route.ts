import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LocalGitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
  additions?: number;
  deletions?: number;
}

export interface LocalGitStatus {
  branch: string;
  isClean: boolean;
  files: LocalGitFile[];
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
}

export async function GET() {
  try {
    const cwd = process.cwd();

    // 1. Get current active local branch
    let currentBranch = 'main';
    try {
      const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd });
      if (branchOut.trim()) currentBranch = branchOut.trim();
    } catch {}

    // 2. Get status porcelain (V1 format: XY PATH)
    const { stdout: statusOut } = await execAsync('git status --porcelain=v1', { cwd });
    const lines = statusOut.split('\n').filter((l) => l.trim().length > 0);

    const files: LocalGitFile[] = [];

    lines.forEach((line) => {
      const indexStatus = line.substring(0, 1);
      const workTreeStatus = line.substring(1, 2);
      const filePath = line.substring(3).trim();

      let status: LocalGitFile['status'] = 'modified';
      let staged = false;

      if (indexStatus !== ' ' && indexStatus !== '?') {
        staged = true;
      }

      if (indexStatus === '?' || workTreeStatus === '?') {
        status = 'untracked';
      } else if (indexStatus === 'A' || workTreeStatus === 'A') {
        status = 'added';
      } else if (indexStatus === 'D' || workTreeStatus === 'D') {
        status = 'deleted';
      } else if (indexStatus === 'R' || workTreeStatus === 'R') {
        status = 'renamed';
      } else {
        status = 'modified';
      }

      files.push({
        path: filePath,
        status,
        staged,
      });
    });

    // 3. Get diff numstat for additions/deletions count
    let totalAdditions = 0;
    let totalDeletions = 0;

    try {
      const { stdout: diffOut } = await execAsync('git diff --numstat', { cwd });
      diffOut.split('\n').filter(Boolean).forEach((line) => {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const add = parseInt(parts[0], 10) || 0;
          const del = parseInt(parts[1], 10) || 0;
          const p = parts[2].trim();
          totalAdditions += add;
          totalDeletions += del;

          const match = files.find((f) => f.path === p);
          if (match) {
            match.additions = add;
            match.deletions = del;
          }
        }
      });
    } catch {}

    const result: LocalGitStatus = {
      branch: currentBranch,
      isClean: files.length === 0,
      files,
      totalFiles: files.length,
      totalAdditions,
      totalDeletions,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error checking local git status:', err);
    return NextResponse.json(
      {
        branch: 'main',
        isClean: true,
        files: [],
        totalFiles: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        error: err.message,
      },
      { status: 200 }
    );
  }
}
