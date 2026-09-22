import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export interface RunNodeRequest {
  nodeId: string;
  nodeTitle?: string;
  runtime: 'shell' | 'nodejs' | 'python' | 'webhook';
  command?: string;
  scriptContent?: string;
  repoPath?: string;
  timeoutMs?: number;
  envVars?: Record<string, string>;
  inputs?: Record<string, any>;
  webhookConfig?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    bodyTemplate?: string;
  };
  context?: {
    branch?: string;
    baseBranch?: string;
    ahead?: number;
    behind?: number;
    committedFiles?: any[];
    upstreamOutputs?: Record<string, any>;
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body: RunNodeRequest = await request.json();
    const {
      nodeId,
      nodeTitle = 'Custom Node',
      runtime,
      command,
      scriptContent,
      repoPath,
      timeoutMs = 30000,
      envVars = {},
      inputs = {},
      webhookConfig,
      context = {},
    } = body;

    const cwd = repoPath && repoPath.trim().length > 0
      ? path.resolve(repoPath)
      : process.cwd();

    // ==========================================
    // 1. DEDICATED WEBHOOK EXECUTION
    // ==========================================
    if (runtime === 'webhook') {
      if (!webhookConfig?.url) {
        return NextResponse.json(
          {
            success: false,
            error: 'Webhook URL is required',
            stdout: '',
            stderr: 'Error: No Webhook URL configured.',
            durationMs: Date.now() - startTime,
          },
          { status: 400 }
        );
      }

      let interpolatedUrl = webhookConfig.url;
      // Interpolate tokens in URL
      interpolatedUrl = interpolatedUrl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (inputs[key] !== undefined) return String(inputs[key]);
        if (context.upstreamOutputs?.[key] !== undefined) return String(context.upstreamOutputs[key]);
        if (key === 'BRANCH') return context.branch || 'main';
        if (key === 'REPO_PATH') return cwd;
        return '';
      });

      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'BranchWatch-Workflow-Engine/1.0',
        ...(webhookConfig.headers || {}),
      };

      let reqBody: string | undefined = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(webhookConfig.method)) {
        if (webhookConfig.bodyTemplate) {
          let tpl = webhookConfig.bodyTemplate;
          // Interpolate body tokens
          tpl = tpl.replace(/\{\{([\w\.\-]+)\}\}/g, (_, key) => {
            if (inputs[key] !== undefined) return String(inputs[key]);
            if (context.upstreamOutputs?.[key] !== undefined) return String(context.upstreamOutputs[key]);
            if (key === 'BRANCH') return context.branch || 'main';
            if (key === 'AHEAD') return String(context.ahead || 0);
            return '';
          });
          reqBody = tpl;
        } else {
          reqBody = JSON.stringify({
            event: 'branchwatch.workflow.step',
            nodeId,
            nodeTitle,
            timestamp: new Date().toISOString(),
            branch: context.branch || 'main',
            ahead: context.ahead || 0,
            behind: context.behind || 0,
            inputs,
          });
        }
      }

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(interpolatedUrl, {
          method: webhookConfig.method,
          headers,
          body: reqBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);
        const durationMs = Date.now() - startTime;
        let responseBodyText = '';
        let parsedJson: any = null;

        try {
          responseBodyText = await response.text();
          try {
            parsedJson = JSON.parse(responseBodyText);
          } catch {
            parsedJson = responseBodyText;
          }
        } catch {
          responseBodyText = '(empty response)';
        }

        const success = response.ok;
        const stdout = `HTTP ${response.status} ${response.statusText}\n${responseBodyText}`;

        return NextResponse.json({
          success,
          status: response.status,
          statusText: response.statusText,
          stdout,
          stderr: success ? '' : `HTTP Error ${response.status}: ${response.statusText}`,
          outputs: {
            status: response.status,
            ok: response.ok,
            body: parsedJson,
            durationMs,
          },
          durationMs,
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutHandle);
        const durationMs = Date.now() - startTime;
        return NextResponse.json({
          success: false,
          status: 0,
          stdout: '',
          stderr: `Webhook dispatch failed: ${fetchErr?.message || 'Network error'}`,
          outputs: {
            status: 0,
            ok: false,
            error: fetchErr?.message,
          },
          durationMs,
        });
      }
    }

    // ==========================================
    // 2. PROCESS RUNNER (Shell / Node.js / Python)
    // ==========================================
    // Build injected Environment Variables
    const injectedEnv: Record<string, string> = {
      ...(process.env as Record<string, string>),
      BW_REPO_PATH: cwd,
      BW_CURRENT_BRANCH: context.branch || 'main',
      BW_BASE_BRANCH: context.baseBranch || 'main',
      BW_AHEAD_COUNT: String(context.ahead ?? 0),
      BW_BEHIND_COUNT: String(context.behind ?? 0),
      BW_COMMITTED_FILES: JSON.stringify(context.committedFiles || []),
      BW_NODE_ID: nodeId,
      BW_NODE_TITLE: nodeTitle,
      ...envVars,
    };

    // Inject dynamic inputs into environment
    Object.entries(inputs).forEach(([k, v]) => {
      injectedEnv[`BW_INPUT_${k.toUpperCase()}`] = String(v ?? '');
    });

    // Determine executable & arguments
    let execFile = '';
    let execArgs: string[] = [];
    const isWin = process.platform === 'win32';

    if (runtime === 'nodejs') {
      execFile = 'node';
      const code = scriptContent || command || 'console.log("No script provided");';
      execArgs = ['-e', code];
    } else if (runtime === 'python') {
      execFile = isWin ? 'python' : 'python3';
      const code = scriptContent || command || 'print("No script provided")';
      execArgs = ['-c', code];
    } else {
      // Shell runtime
      const cmdToRun = command || scriptContent || 'git status';
      if (isWin) {
        execFile = 'powershell.exe';
        execArgs = ['-NoProfile', '-NonInteractive', '-Command', cmdToRun];
      } else {
        execFile = '/bin/sh';
        execArgs = ['-c', cmdToRun];
      }
    }

    // Execute with child_process.spawn
    return await new Promise<NextResponse>((resolve) => {
      let stdoutAcc = '';
      let stderrAcc = '';
      let isTimedOut = false;

      const child: any = spawn(execFile, execArgs, {
        cwd,
        env: { ...process.env, ...injectedEnv },
        shell: false,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill?.('SIGTERM');
      }, timeoutMs);

      if (child.stdout) {
        child.stdout.on('data', (chunk: Buffer) => {
          stdoutAcc += chunk.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (chunk: Buffer) => {
          stderrAcc += chunk.toString();
        });
      }

      child.on('error', (err: any) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve(
          NextResponse.json({
            success: false,
            exitCode: -1,
            stdout: stdoutAcc,
            stderr: `${stderrAcc}\nProcess spawn error: ${err?.message || String(err)}`.trim(),
            outputs: {
              exitCode: -1,
              stdout: stdoutAcc,
              stderr: err?.message || String(err),
            },
            durationMs,
          })
        );
      });

      child.on('close', (code: number | null) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        const exitCode = isTimedOut ? 124 : (code ?? 0);
        const success = exitCode === 0;

        if (isTimedOut) {
          stderrAcc += `\n[Execution timed out after ${timeoutMs}ms]`;
        }

        resolve(
          NextResponse.json({
            success,
            exitCode,
            stdout: stdoutAcc.trim(),
            stderr: stderrAcc.trim(),
            outputs: {
              exitCode,
              stdout: stdoutAcc.trim(),
              stderr: stderrAcc.trim(),
              durationMs,
            },
            durationMs,
          })
        );
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error?.message || 'Failed to execute node',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
