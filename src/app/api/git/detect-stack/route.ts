import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PluginNodeDefinition } from '@/lib/pluginTypes';

interface DetectedTool {
  id: string;
  name: string;
  category: string;
  description: string;
  filesMatched: string[];
  suggestedNode: Partial<PluginNodeDefinition>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoPath = searchParams.get('repoPath') || process.cwd();

  if (!fs.existsSync(repoPath)) {
    return NextResponse.json({ error: 'Repository path does not exist' }, { status: 404 });
  }

  const detectedTools: DetectedTool[] = [];

  try {
    // 1. Check package.json (Node.js, TypeScript, Next.js, Jest, ESLint, Prisma)
    const pkgPath = path.join(repoPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
          ...(pkg.scripts || {}),
        };

        // TypeScript / Typecheck Guard
        if (allDeps['typescript'] || fs.existsSync(path.join(repoPath, 'tsconfig.json'))) {
          detectedTools.push({
            id: 'typescript-guard',
            name: 'TypeScript Typecheck Guard',
            category: 'testing',
            description: 'Executes compiler type verification to prevent pushing broken TypeScript code.',
            filesMatched: ['package.json', 'tsconfig.json'],
            suggestedNode: {
              id: 'project.typecheck',
              name: 'TypeScript Guard',
              description: 'Verifies zero TypeScript errors before committing or branching.',
              category: 'testing',
              runtime: 'shell',
              iconName: 'Shield',
              permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
              commandTemplate: 'npx tsc --noEmit',
              inputPort: { type: 'WorkingTreeChanges', label: 'Working Tree' },
              outputPort: { type: 'StagedChanges', label: 'Staged Changes' },
              onFailure: 'halt',
            },
          });
        }

        // ESLint / Linter
        if (allDeps['eslint'] || fs.existsSync(path.join(repoPath, '.eslintrc.json')) || fs.existsSync(path.join(repoPath, 'eslint.config.mjs'))) {
          detectedTools.push({
            id: 'eslint-linter',
            name: 'ESLint Code Quality Guard',
            category: 'testing',
            description: 'Scans staging files for code style, security flaws, and syntax errors.',
            filesMatched: ['eslint.config.*', '.eslintrc.*'],
            suggestedNode: {
              id: 'project.eslint',
              name: 'ESLint Quality Guard',
              description: 'Runs project linter to guarantee code formatting and cleanliness.',
              category: 'testing',
              runtime: 'shell',
              iconName: 'Shield',
              permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
              commandTemplate: 'npm run lint',
              inputPort: { type: 'WorkingTreeChanges', label: 'Working Tree' },
              outputPort: { type: 'StagedChanges', label: 'Staged Changes' },
              onFailure: 'halt',
            },
          });
        }

        // Prisma ORM
        if (allDeps['prisma'] || allDeps['@prisma/client'] || fs.existsSync(path.join(repoPath, 'prisma'))) {
          detectedTools.push({
            id: 'prisma-migration',
            name: 'Prisma Schema & Migration Validator',
            category: 'automation',
            description: 'Validates Prisma schema and ensures database migration sync before branching.',
            filesMatched: ['prisma/schema.prisma', 'prisma/'],
            suggestedNode: {
              id: 'project.prisma-validate',
              name: 'Prisma Schema Validator',
              description: 'Validates schema consistency and generates typed Prisma client.',
              category: 'automation',
              runtime: 'shell',
              iconName: 'Database',
              permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
              commandTemplate: 'npx prisma validate && npx prisma generate',
              inputPort: { type: 'BranchRef', label: 'Branch' },
              outputPort: { type: 'BranchRef', label: 'Branch' },
              onFailure: 'halt',
            },
          });
        }

        // Jest / Vitest / Test runner
        if (allDeps['jest'] || allDeps['vitest'] || pkg.scripts?.test) {
          detectedTools.push({
            id: 'unit-tests',
            name: 'Unit & Integration Test Suite',
            category: 'testing',
            description: 'Executes automated unit tests to ensure branch integrity.',
            filesMatched: ['package.json (scripts.test)'],
            suggestedNode: {
              id: 'project.test-suite',
              name: 'Unit Test Runner',
              description: 'Runs project automated test suite before allowing branch merges.',
              category: 'testing',
              runtime: 'shell',
              iconName: 'Terminal',
              permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
              commandTemplate: 'npm test',
              inputPort: { type: 'BranchRef', label: 'Branch' },
              outputPort: { type: 'BranchRef', label: 'Branch' },
              onFailure: 'halt',
            },
          });
        }
      } catch (err) {
        console.error('Failed to parse package.json for stack detection:', err);
      }
    }

    // 2. Check Rust / Cargo
    if (fs.existsSync(path.join(repoPath, 'Cargo.toml'))) {
      detectedTools.push({
        id: 'cargo-check',
        name: 'Cargo Rust Quality Check',
        category: 'testing',
        description: 'Runs cargo check and cargo test for Rust projects.',
        filesMatched: ['Cargo.toml'],
        suggestedNode: {
          id: 'project.cargo-check',
          name: 'Cargo Check & Test',
          description: 'Validates compilation and runs Rust unit tests.',
          category: 'testing',
          runtime: 'shell',
          iconName: 'Terminal',
          permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
          commandTemplate: 'cargo check && cargo test',
          inputPort: { type: 'BranchRef', label: 'Branch' },
          outputPort: { type: 'BranchRef', label: 'Branch' },
          onFailure: 'halt',
        },
      });
    }

    // 3. Check Python (pyproject.toml, requirements.txt, setup.py)
    if (
      fs.existsSync(path.join(repoPath, 'pyproject.toml')) ||
      fs.existsSync(path.join(repoPath, 'requirements.txt')) ||
      fs.existsSync(path.join(repoPath, 'setup.py'))
    ) {
      detectedTools.push({
        id: 'python-pytest',
        name: 'Python Pytest Suite',
        category: 'testing',
        description: 'Runs pytest suite against the active Python project.',
        filesMatched: ['pyproject.toml', 'requirements.txt'],
        suggestedNode: {
          id: 'project.pytest',
          name: 'Pytest Suite',
          description: 'Executes Python regression test suite.',
          category: 'testing',
          runtime: 'python',
          iconName: 'Terminal',
          permissions: { shell: true, filesystem: 'workspace', git: true, network: false },
          scriptContent: `import os, sys, subprocess\nprint(f"Running tests on branch: {os.environ.get('BW_CURRENT_BRANCH')}")\nres = subprocess.run(["python", "-m", "pytest", "-v"])\nsys.exit(res.returncode)`,
          inputPort: { type: 'BranchRef', label: 'Branch' },
          outputPort: { type: 'BranchRef', label: 'Branch' },
          onFailure: 'halt',
        },
      });
    }

    // 4. Check Docker (Dockerfile, docker-compose.yml)
    if (fs.existsSync(path.join(repoPath, 'Dockerfile')) || fs.existsSync(path.join(repoPath, 'docker-compose.yml'))) {
      detectedTools.push({
        id: 'docker-build',
        name: 'Docker Container Build & Healthcheck',
        category: 'devops',
        description: 'Validates Docker container build before promoting releases.',
        filesMatched: ['Dockerfile'],
        suggestedNode: {
          id: 'project.docker-build',
          name: 'Docker Smoke Build',
          description: 'Builds local Docker container image to verify build reproducibility.',
          category: 'devops',
          runtime: 'shell',
          iconName: 'Archive',
          permissions: { shell: true, filesystem: 'workspace', git: true, network: true },
          commandTemplate: 'docker build -t branchwatch-build-test .',
          inputPort: { type: 'BranchRef', label: 'Branch' },
          outputPort: { type: 'RemoteRef', label: 'Remote' },
          onFailure: 'halt',
        },
      });
    }

    return NextResponse.json({
      repoPath,
      toolsCount: detectedTools.length,
      tools: detectedTools,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to detect workspace stack' }, { status: 500 });
  }
}
