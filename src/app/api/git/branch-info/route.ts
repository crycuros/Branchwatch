import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface BranchFileInfo {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
}

export interface BranchCommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface BranchComparisonInfo {
  branch: string;
  baseBranch: string;
  ahead: number;
  behind: number;
  availableBranches: string[];
  totalCommitsCount: number;
  commits: BranchCommitInfo[];
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
    const customRepoPath = searchParams.get('repoPath');

    const cwd = customRepoPath && customRepoPath.trim().length > 0
      ? path.resolve(customRepoPath)
      : process.cwd();

    // 1. Get available local branches in this repo
    let availableBranches: string[] = [];
    try {
      const { stdout: branchesOut } = await execAsync('git branch --format="%(refname:short)"', { cwd });
      availableBranches = branchesOut
        .split('\n')
        .map((b) => b.trim())
        .filter((b) => b.length > 0 && !b.startsWith('(HEAD detached'));
    } catch {
      availableBranches = ['main'];
    }

    // 2. Get current active branch if not specified
    let targetBranch = branch;
    if (!targetBranch) {
      try {
        const { stdout: bOut } = await execAsync('git branch --show-current', { cwd });
        targetBranch = bOut.trim() || availableBranches[0] || 'HEAD';
      } catch {
        targetBranch = availableBranches[0] || 'HEAD';
      }
    }

    // 3. Check if base branch exists locally, fallback if needed
    let effectiveBase = base;
    try {
      await execAsync(`git rev-parse --verify ${effectiveBase}`, { cwd });
    } catch {
      try {
        await execAsync(`git rev-parse --verify master`, { cwd });
        effectiveBase = 'master';
      } catch {
        // Fallback to targetBranch or first available
        effectiveBase = availableBranches.find((b) => b !== targetBranch) || targetBranch;
      }
    }

    // 4. Ahead / Behind calculation: git rev-list --left-right --count <base>...<target>
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

    // 5. Branch Commit Stack History (git log <base>..<target> or last 10 on <target>)
    const commits: BranchCommitInfo[] = [];
    try {
      let logCmd = `git log --pretty=format:"%H|%s|%an|%cI" -n 25 ${effectiveBase}..${targetBranch}`;
      if (effectiveBase === targetBranch) {
        logCmd = `git log --pretty=format:"%H|%s|%an|%cI" -n 10 ${targetBranch}`;
      }

      const { stdout: logOut } = await execAsync(logCmd, { cwd });
      const logLines = logOut.split('\n').filter((l) => l.trim().length > 0);

      logLines.forEach((line) => {
        const [fullSha, message, author, date] = line.split('|');
        if (fullSha) {
          commits.push({
            sha: fullSha.substring(0, 7),
            message: (message || '').trim(),
            author: (author || 'Unknown').trim(),
            date: date || new Date().toISOString(),
          });
        }
      });

      // If log is empty because branch has no unique commits vs base, fetch top 5 recent commits on targetBranch
      if (commits.length === 0) {
        const { stdout: fallbackLog } = await execAsync(
          `git log --pretty=format:"%H|%s|%an|%cI" -n 5 ${targetBranch}`,
          { cwd }
        );
        fallbackLog.split('\n').filter((l) => l.trim().length > 0).forEach((line) => {
          const [fullSha, message, author, date] = line.split('|');
          if (fullSha) {
            commits.push({
              sha: fullSha.substring(0, 7),
              message: (message || '').trim(),
              author: (author || 'Unknown').trim(),
              date: date || new Date().toISOString(),
            });
          }
        });
      }
    } catch (err) {
      console.error('Error fetching branch commits log:', err);
    }

    // 6. Committed files calculation: git diff --numstat <base>...<target>
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
      availableBranches: availableBranches.length > 0 ? availableBranches : [targetBranch, 'main'],
      totalCommitsCount: commits.length,
      commits,
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
