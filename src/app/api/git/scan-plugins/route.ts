import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PluginNodeDefinition } from '@/lib/pluginTypes';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customRepoPath = searchParams.get('repoPath');

    const cwd = customRepoPath && customRepoPath.trim().length > 0
      ? path.resolve(customRepoPath)
      : process.cwd();

    const discoveredPlugins: PluginNodeDefinition[] = [];

    // Check .branchwatch/nodes directory
    const nodesDir = path.join(cwd, '.branchwatch', 'nodes');
    if (fs.existsSync(nodesDir)) {
      const files = fs.readdirSync(nodesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(nodesDir, file), 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.id || parsed.name)) {
              discoveredPlugins.push({
                schemaVersion: parsed.schemaVersion || 1,
                id: parsed.id || `workspace.${path.basename(file, '.json')}`,
                name: parsed.name || path.basename(file, '.json'),
                version: parsed.version || '1.0.0',
                description: parsed.description || 'Workspace repository custom node',
                author: parsed.author || { name: 'Repository Contributor' },
                homepage: parsed.homepage,
                tags: parsed.tags || ['workspace', 'local'],
                platforms: parsed.platforms || ['windows', 'linux', 'darwin'],
                iconName: parsed.iconName || 'Terminal',
                category: parsed.category || 'custom',
                runtime: parsed.runtime || 'shell',
                permissions: parsed.permissions || {
                  filesystem: 'workspace',
                  network: false,
                  git: true,
                  shell: true,
                },
                inputPort: parsed.inputPort || { type: 'BranchRef', label: 'Input' },
                outputPort: parsed.outputPort || { type: 'BranchRef', label: 'Output' },
                configSchema: parsed.configSchema || [],
                commandTemplate: parsed.commandTemplate,
                scriptContent: parsed.scriptContent,
                timeoutMs: parsed.timeoutMs,
                webhookConfig: parsed.webhookConfig,
                inputs: parsed.inputs,
                outputs: parsed.outputs,
                onFailure: parsed.onFailure || 'halt',
                source: 'workspace',
                installed: true,
                createdAt: new Date().toISOString(),
              });
            }
          } catch (readErr) {
            console.error(`Error reading plugin node file ${file}:`, readErr);
          }
        }
      }
    }

    // Also check single branchwatch.config.json in repo root
    const configPath = path.join(cwd, 'branchwatch.config.json');
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.nodes)) {
          parsed.nodes.forEach((node: any) => {
            if (node.id && !discoveredPlugins.some((p) => p.id === node.id)) {
              discoveredPlugins.push({
                schemaVersion: node.schemaVersion || 1,
                id: node.id,
                name: node.name || node.id,
                version: node.version || '1.0.0',
                description: node.description || 'Configured workspace node',
                author: node.author || { name: 'Repository Config' },
                iconName: node.iconName || 'Terminal',
                category: node.category || 'custom',
                runtime: node.runtime || 'shell',
                permissions: node.permissions || { filesystem: 'workspace', shell: true },
                inputPort: node.inputPort || { type: 'BranchRef', label: 'Input' },
                outputPort: node.outputPort || { type: 'BranchRef', label: 'Output' },
                configSchema: node.configSchema || [],
                commandTemplate: node.commandTemplate,
                scriptContent: node.scriptContent,
                webhookConfig: node.webhookConfig,
                inputs: node.inputs,
                outputs: node.outputs,
                source: 'workspace',
                installed: true,
                createdAt: new Date().toISOString(),
              });
            }
          });
        }
      } catch {}
    }

    return NextResponse.json({
      repoPath: cwd,
      count: discoveredPlugins.length,
      plugins: discoveredPlugins,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to scan workspace plugins' },
      { status: 500 }
    );
  }
}
