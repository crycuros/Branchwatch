import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BranchFileInfo {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
}

export interface BranchComparisonInfo {
  branch: string;
  baseBranch: string;
  ahead: number;
  behind: number;
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  files: BranchFileInfo[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const base = searchParams.get('base') || 'main';

    const cwd = process.cwd();

    // 1. Get current active branch if not specified
    let targetBranch = branch;
    if (!targetBranch) {
      try {
        const { stdout: bOut } = await execAsync('git branch --show-current', { cwd });
        targetBranch = bOut.trim() || 'HEAD';
      } catch {
        targetBranch = 'HEAD';
      }
    }

    // 2. Check if base branch exists locally, fallback if needed
    let effectiveBase = base;
    try {
      await execAsync(`git rev-parse --verify ${effectiveBase}`, { cwd });
    } catch {
      try {
        await execAsync(`git rev-parse --verify master`, { cwd });
        effectiveBase = 'master';
      } catch {
        effectiveBase = targetBranch;
      }
    }

    // 3. Ahead / Behind calculation: git rev-list --left-right --count <base>...<target>
    let ahead = 0;
    let behind = 0;

    if (effectiveBase !== targetBranch) {
      try {
        const { stdout: revOut } = await execAsync(
          `git rev-list --left-right --count ${effectiveBase}...${targetBranch}`,
          { cwd }
        );
        const parts = revOut.trim().split(/\s+/);
        if (parts.length >= 2) {
          behind = parseInt(parts[0], 10) || 0;
          ahead = parseInt(parts[1], 10) || 0;
        }
      } catch (err) {
        console.error('Error checking rev-list:', err);
      }
    }

    // 4. Committed files calculation: git diff --numstat <base>...<target>
    const files: BranchFileInfo[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    if (effectiveBase !== targetBranch) {
      try {
        const { stdout: diffOut } = await execAsync(
          `git diff --numstat ${effectiveBase}...${targetBranch}`,
          { cwd }
        );
        const lines = diffOut.split('\n').filter((l) => l.trim().length > 0);

        lines.forEach((line) => {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            const add = parts[0] === '-' ? 0 : parseInt(parts[0], 10) || 0;
            const del = parts[1] === '-' ? 0 : parseInt(parts[1], 10) || 0;
            const filePath = parts[2].trim();

            totalAdditions += add;
            totalDeletions += del;

            let status: BranchFileInfo['status'] = 'modified';
            if (add > 0 && del === 0) status = 'added';
            else if (add === 0 && del > 0) status = 'deleted';

            files.push({
              path: filePath,
              status,
              additions: add,
              deletions: del,
            });
          }
        });
      } catch (err) {
        console.error('Error running diff numstat:', err);
      }
    }

    const payload: BranchComparisonInfo = {
      branch: targetBranch,
      baseBranch: effectiveBase,
      ahead,
      behind,
      totalFiles: files.length,
      totalAdditions,
      totalDeletions,
      files,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to inspect branch info' },
      { status: 500 }
    );
  }
}
