import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LocalExecuteRequest {
  action: 'status' | 'stage' | 'commit' | 'branch' | 'push' | 'pull';
  files?: string[];
  message?: string;
  branchName?: string;
  remoteName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const cwd = process.cwd();
    const body: LocalExecuteRequest = await request.json();
    const { action, files, message, branchName, remoteName } = body;

    let command = '';
    let output = '';

    switch (action) {
      case 'status': {
        command = 'git status';
        const { stdout } = await execAsync(command, { cwd });
        output = stdout;
        break;
      }

      case 'stage': {
        if (files && files.length > 0) {
          const fileArgs = files.map((f) => `"${f.replace(/"/g, '\\"')}"`).join(' ');
          command = `git add ${fileArgs}`;
        } else {
          command = 'git add .';
        }
        const { stdout, stderr } = await execAsync(command, { cwd });
        output = stdout || stderr || 'Files staged successfully.';
        break;
      }

      case 'commit': {
        if (!message || !message.trim()) {
          return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
        }
        const cleanMsg = message.replace(/"/g, '\\"');
        command = `git commit -m "${cleanMsg}"`;
        const { stdout, stderr } = await execAsync(command, { cwd });
        output = stdout || stderr;
        break;
      }

      case 'branch': {
        const targetBranch = (branchName || '').trim();
        if (!targetBranch) {
          return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
        }
        // Try switch -c first, if branch already exists, switch to it
        try {
          command = `git switch -c "${targetBranch}"`;
          const { stdout, stderr } = await execAsync(command, { cwd });
          output = stdout || stderr;
        } catch {
          command = `git switch "${targetBranch}"`;
          const { stdout, stderr } = await execAsync(command, { cwd });
          output = stdout || stderr;
        }
        break;
      }

      case 'push': {
        const remote = remoteName || 'origin';
        const b = branchName || 'HEAD';
        command = `git push -u ${remote} ${b}`;
        const { stdout, stderr } = await execAsync(command, { cwd });
        output = stdout || stderr || 'Pushed to remote successfully.';
        break;
      }

      case 'pull': {
        const remote = remoteName || 'origin';
        const b = branchName || 'main';
        command = `git pull ${remote} ${b}`;
        const { stdout, stderr } = await execAsync(command, { cwd });
        output = stdout || stderr;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Grab latest commit SHA if available
    let latestSha = '';
    try {
      const { stdout: shaOut } = await execAsync('git rev-parse --short HEAD', { cwd });
      latestSha = shaOut.trim();
    } catch {}

    return NextResponse.json({
      success: true,
      command,
      output: output.trim(),
      sha: latestSha,
    });
  } catch (err: any) {
    console.error('Error executing local git command:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Command execution failed',
        stderr: err.stderr || '',
      },
      { status: 500 }
    );
  }
}
