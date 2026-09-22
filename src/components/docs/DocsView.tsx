import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Code2,
  Terminal,
  Shield,
  Globe,
  FolderGit2,
  Layers,
  ArrowRight,
  GitBranch,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface DocSection {
  id: string;
  category: string;
  title: string;
  description: string;
  content: {
    overview: string;
    codeSnippet?: {
      language: string;
      code: string;
      filename?: string;
    };
    tableData?: {
      headers: string[];
      rows: string[][];
    };
    tips?: string[];
  };
}

const DOCS_DATABASE: DocSection[] = [
  // 1. Getting Started
  {
    id: 'overview',
    category: '1. Getting Started',
    title: 'Platform Overview',
    description: 'Understand the architecture of BranchWatch and its Developer Extensibility Platform.',
    content: {
      overview:
        'BranchWatch is a developer-first Git visualization and automation engine. Beyond monitoring working trees, branch divergence, and commit history, BranchWatch features a Blender-style extensible node system where developers can author, share, and chain custom CLI tasks, scripts, and webhooks as first-class workflow nodes.',
      tips: [
        'All visual nodes can be connected via typed ports (WorkingTree, Stage, Commit, Branch, Remote).',
        'External projects can port their own CLI commands by creating a .branchwatch/nodes/ directory.',
        'Zero remote pushes occur automatically — user remains in complete control.',
      ],
    },
  },
  {
    id: 'quickstart',
    category: '1. Getting Started',
    title: '5-Minute Quickstart',
    description: 'Add your first custom node and execute it inside a visual workflow graph.',
    content: {
      overview:
        'To create a custom node in BranchWatch, navigate to the "Dev Studio" or click "+ Script Studio" inside the Visual Workflow canvas. Select your preferred runtime (Shell, Node.js, Python, or Webhook), write your script, test it live in the sandbox console, and save it to your node library.',
      codeSnippet: {
        language: 'bash',
        filename: 'Terminal Command',
        code: `# Run your custom node directly in the active repository
echo "Current branch: $BW_CURRENT_BRANCH"
npx tsc --noEmit
exit 0`,
      },
    },
  },

  // 2. Manifest Schema v1
  {
    id: 'manifest-spec',
    category: '2. Manifest Schema v1',
    title: 'Manifest Specification',
    description: 'The standard JSON schema for BranchWatch Schema Version 1 custom nodes.',
    content: {
      overview:
        'Every custom node is defined by a portable JSON manifest compliant with Schema Version 1. Manifests specify unique namespaced identifiers, author metadata, port types, declared permissions, dynamic inputs, and command templates.',
      codeSnippet: {
        language: 'json',
        filename: '.branchwatch/nodes/typecheck.json',
        code: `{
  "schemaVersion": 1,
  "id": "my-project.typecheck",
  "name": "TypeCheck Guard",
  "version": "1.0.0",
  "description": "Runs TypeScript check before push",
  "author": { "name": "Dev Team" },
  "runtime": "shell",
  "permissions": {
    "filesystem": "workspace",
    "shell": true,
    "git": false,
    "network": false
  },
  "inputPort": { "type": "CommitRef", "label": "Commit" },
  "outputPort": { "type": "BranchRef", "label": "Branch" },
  "commandTemplate": "npm run typecheck",
  "inputs": { "branch": "{{BRANCH}}" },
  "outputs": {
    "exitCode": "$EXIT_CODE",
    "stdout": "$STDOUT"
  },
  "onFailure": "halt"
}`,
      },
    },
  },
  {
    id: 'port-types',
    category: '2. Manifest Schema v1',
    title: 'Port Compatibility Matrix',
    description: 'Semantic data types defining how nodes connect on the visual canvas.',
    content: {
      overview:
        'BranchWatch employs a typed port connection system. Connections between incompatible ports (e.g. connecting a RemoteRef directly to an uncommitted Stage) are blocked to maintain Git execution integrity.',
      tableData: {
        headers: ['Port Data Type', 'Description', 'Compatible Target Inputs'],
        rows: [
          ['WorkingTreeChanges', 'Unstaged local changes in working directory', 'Stage, Custom Stash'],
          ['StagedChanges', 'Index files ready for commit object creation', 'Commit, Linter Nodes'],
          ['CommitRef', 'Created commit object reference (SHA, message)', 'Branch, Tag, Release Guards'],
          ['BranchRef', 'Active or target Git branch pointer', 'Push, Pull, Upstream Sync, Webhook'],
          ['RemoteRef', 'Remote upstream repository reference', 'Notification / Webhooks'],
          ['None', 'Standalone / terminal node', 'Any (Manual trigger)'],
        ],
      },
    },
  },

  // 3. Scripting & Runtimes
  {
    id: 'shell-execution',
    category: '3. Scripting & Runtimes',
    title: 'Shell / CLI Runtime',
    description: 'Execute native CLI tools, compilers, and shell commands directly in the repo.',
    content: {
      overview:
        'The Shell runtime executes commands in the active repository directory using the system default shell (PowerShell on Windows, /bin/sh on Unix). Standard output and standard error are captured and streamed in real-time to the Terminal Drawer.',
      codeSnippet: {
        language: 'bash',
        filename: 'shell command template',
        code: `# Template variables are interpolated automatically
npm run lint && npm test -- --branch={{BRANCH}}`,
      },
      tips: [
        'Exit code 0 indicates success and allows downstream workflow execution.',
        'Exit code != 0 signals failure and immediately halts dangerous push nodes when onFailure is "halt".',
      ],
    },
  },
  {
    id: 'nodejs-runner',
    category: '3. Scripting & Runtimes',
    title: 'Node.js Script Runtime',
    description: 'Run inline JavaScript and Node.js automation scripts with full environment access.',
    content: {
      overview:
        'The Node.js runtime executes inline scripts using the local node binary with standard Node APIs (fs, path, child_process, crypto).',
      codeSnippet: {
        language: 'javascript',
        filename: 'scripts/verify-release.js',
        code: `const branch = process.env.BW_CURRENT_BRANCH;
const ahead = parseInt(process.env.BW_AHEAD_COUNT || '0', 10);
const files = JSON.parse(process.env.BW_COMMITTED_FILES || '[]');

console.log(\`Analyzing branch \${branch} with \${files.length} modified files...\`);

if (ahead > 50) {
  console.error("Branch is too far ahead. Please rebase before proceeding.");
  process.exit(1);
}

console.log("Release verification successful.");
process.exit(0);`,
      },
    },
  },
  {
    id: 'python-scripts',
    category: '3. Scripting & Runtimes',
    title: 'Python Script Runtime',
    description: 'Leverage Python data analysis and custom scripts directly in the pipeline.',
    content: {
      overview:
        'The Python runtime executes inline scripts using the local python binary, passing Git and workspace metadata as environment variables.',
      codeSnippet: {
        language: 'python',
        filename: 'check_branch.py',
        code: `import os, sys, json

repo = os.environ.get("BW_REPO_PATH")
branch = os.environ.get("BW_CURRENT_BRANCH")
files = json.loads(os.environ.get("BW_COMMITTED_FILES", "[]"))

print(f"Checking {len(files)} files in branch {branch}...")

for f in files:
    if f["path"].endswith(".env"):
        print("Security Alert: .env file committed!", file=sys.stderr)
        sys.exit(1)

print("Check passed cleanly.")
sys.exit(0)`,
      },
    },
  },
  {
    id: 'webhooks-http',
    category: '3. Scripting & Runtimes',
    title: 'Dedicated Webhook Engine',
    description: 'Dispatch native HTTP requests to Slack, Discord, CI/CD, or internal microservices.',
    content: {
      overview:
        'Webhooks operate as pure HTTP clients (GET, POST, PUT, PATCH, DELETE) with custom request headers and JSON payload templates. Unlike process execution, webhooks evaluate HTTP status codes (e.g. 200 OK) and store the JSON response body in the workflow context.',
      codeSnippet: {
        language: 'json',
        filename: 'webhook payload template',
        code: `{
  "event": "branchwatch.step.completed",
  "branch": "{{BRANCH}}",
  "aheadCount": {{AHEAD}},
  "timestamp": "{{TIMESTAMP}}"
}`,
      },
    },
  },

  // 4. Context & Environment Variables
  {
    id: 'bw-env-vars',
    category: '4. Context & Environment Variables',
    title: 'Standard BW_* Environment Variables',
    description: 'Complete reference of runtime variables injected into every custom script node.',
    content: {
      overview:
        'When BranchWatch executes a custom node, it automatically injects a standard set of environment variables representing the active repository and branch state.',
      tableData: {
        headers: ['Environment Variable', 'Type', 'Example / Description'],
        rows: [
          ['BW_REPO_PATH', 'string', 'Absolute path to repository (e.g. C:/Projects/App)'],
          ['BW_CURRENT_BRANCH', 'string', 'Active working branch name (e.g. feature/auth)'],
          ['BW_BASE_BRANCH', 'string', 'Target comparison base branch (e.g. main)'],
          ['BW_AHEAD_COUNT', 'number (string)', 'Number of unmerged commits ahead of base'],
          ['BW_BEHIND_COUNT', 'number (string)', 'Number of commits behind base'],
          ['BW_COMMITTED_FILES', 'JSON array string', '[{"path":"src/app.ts","status":"modified","additions":10,"deletions":2}]'],
          ['BW_NODE_ID', 'string', 'Unique identifier of the executing workflow node'],
          ['BW_NODE_TITLE', 'string', 'Display title of the executing node'],
          ['BW_INPUT_<KEY>', 'string', 'Dynamic parameter values supplied by the user in Inspector'],
        ],
      },
    },
  },

  // 5. Security & Permissions
  {
    id: 'permissions-model',
    category: '5. Security & Permissions',
    title: 'Security & Permission Clearance',
    description: 'Granular permissions and user authorization guards for custom scripts.',
    content: {
      overview:
        'To prevent arbitrary or malicious command execution from discovered community nodes, BranchWatch enforces a strict permission model. Every node declares its required capabilities (Shell, Filesystem, Network, Git), and unapproved nodes trigger a security clearance dialog before running on your machine.',
      tableData: {
        headers: ['Permission Scope', 'Options', 'Impact'],
        rows: [
          ['shell', 'true | false', 'Allows spawning sub-processes (bash, npm, docker, etc.)'],
          ['filesystem', 'workspace | none | all', 'Restricts filesystem access to repository boundary'],
          ['network', 'true | false', 'Allows outbound HTTP webhook calls'],
          ['git', 'true | false', 'Allows reading and mutating local Git state'],
        ],
      },
    },
  },

  // 6. Composable Chaining
  {
    id: 'composable-chaining',
    category: '6. Composable Chaining',
    title: 'Inputs, Outputs & Conditions',
    description: 'Chain multiple nodes together using dynamic upstream outputs and conditional paths.',
    content: {
      overview:
        'Custom nodes produce outputs ($EXIT_CODE, $STDOUT, $STDERR, $STATUS, $RESPONSE_BODY) stored in the execution context store. Downstream nodes can consume these values using the token {{NODE.<node_alias>.<output_key>}}.',
      codeSnippet: {
        language: 'json',
        filename: 'chained node definition',
        code: `{
  "id": "deploy-preview",
  "name": "Deploy Preview",
  "runtime": "shell",
  "commandTemplate": "vercel deploy --build-env RELEASE_TAG={{NODE.tag-release.stdout}}",
  "inputs": {
    "releaseTag": "{{NODE.tag-release.stdout}}"
  }
}`,
      },
    },
  },

  // 7. Starter Recipes
  {
    id: 'starter-recipes',
    category: '7. Starter Recipes',
    title: 'Starter Recipes & Blueprints',
    description: 'Copy-paste ready node manifests for common real-world developer workflows.',
    content: {
      overview:
        'Explore pre-built recipe templates ready to drop into your .branchwatch/nodes/ folder.',
      codeSnippet: {
        language: 'json',
        filename: '.branchwatch/nodes/prisma-migrate.json',
        code: `{
  "schemaVersion": 1,
  "id": "project.prisma-migrate",
  "name": "Prisma Schema Validate",
  "version": "1.0.0",
  "description": "Validates database schema and generates client",
  "runtime": "shell",
  "permissions": { "filesystem": "workspace", "shell": true },
  "inputPort": { "type": "CommitRef", "label": "Commit" },
  "outputPort": { "type": "BranchRef", "label": "Branch" },
  "commandTemplate": "npx prisma validate && npx prisma generate",
  "onFailure": "halt"
}`,
      },
    },
  },
];

export const DocsView: React.FC<{
  onOpenStudio: () => void;
  onOpenWorkflow: () => void;
}> = ({ onOpenStudio, onOpenWorkflow }) => {
  const [activeDocId, setActiveDocId] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categories = Array.from(new Set(DOCS_DATABASE.map((d) => d.category)));

  const currentDocIndex = DOCS_DATABASE.findIndex((d) => d.id === activeDocId);
  const currentDoc = DOCS_DATABASE[currentDocIndex] || DOCS_DATABASE[0];

  const prevDoc = currentDocIndex > 0 ? DOCS_DATABASE[currentDocIndex - 1] : null;
  const nextDoc = currentDocIndex < DOCS_DATABASE.length - 1 ? DOCS_DATABASE[currentDocIndex + 1] : null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredDocs = searchQuery
    ? DOCS_DATABASE.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-neutral-100/50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Docs Sidebar */}
      <aside className="w-full md:w-72 h-auto md:h-full border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 backdrop-blur-xl p-4 flex flex-col justify-between flex-shrink-0 overflow-y-auto no-scrollbar">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span className="font-bold text-xs uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Documentation
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
              v1.0
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400"
            />
          </div>

          {/* Nav Categories */}
          <div className="space-y-4">
            {filteredDocs ? (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase px-2">
                  Search Results ({filteredDocs.length})
                </div>
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeDocId === doc.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2">
                    {cat}
                  </div>
                  {DOCS_DATABASE.filter((d) => d.category === cat).map((doc) => {
                    const isActive = activeDocId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDocId(doc.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none ${
                          isActive
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate">{doc.title}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Studio Trigger */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenStudio}
            className="w-full flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Script Studio</span>
          </Button>
        </div>
      </aside>

      {/* Main Documentation Reader Canvas */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar p-6 md:p-10 space-y-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span>Documentation</span>
          <span>/</span>
          <span>{currentDoc.category}</span>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{currentDoc.title}</span>
        </div>

        {/* Article Header */}
        <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {currentDoc.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {currentDoc.description}
          </p>
        </div>

        {/* Overview paragraph */}
        <div className="prose dark:prose-invert max-w-none text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-4">
          <p>{currentDoc.content.overview}</p>

          {/* Table Data if present */}
          {currentDoc.content.tableData && (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                  <tr>
                    {currentDoc.content.tableData.headers.map((h, i) => (
                      <th key={i} className="p-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {currentDoc.content.tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-3 ${cIdx === 0 ? 'font-bold text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Code Snippet if present */}
          {currentDoc.content.codeSnippet && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 overflow-hidden mt-4 shadow-subtle">
              {currentDoc.content.codeSnippet.filename && (
                <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                  <span>{currentDoc.content.codeSnippet.filename}</span>
                  <button
                    onClick={() => handleCopy(currentDoc.content.codeSnippet!.code)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedCode === currentDoc.content.codeSnippet.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode === currentDoc.content.codeSnippet.code ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
              <pre className="p-4 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
                {currentDoc.content.codeSnippet.code}
              </pre>
            </div>
          )}

          {/* Tips / Callouts */}
          {currentDoc.content.tips && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-2 mt-4">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                Key Architectural Notes
              </span>
              <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400 list-disc list-inside">
                {currentDoc.content.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Prev / Next Footer Navigation */}
        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
          {prevDoc ? (
            <button
              onClick={() => setActiveDocId(prevDoc.id)}
              className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 text-left transition-colors flex items-center gap-2 group"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400 group-hover:-translate-x-0.5 transition-transform" />
              <div>
                <div className="text-[10px] text-neutral-400">Previous</div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {prevDoc.title}
                </div>
              </div>
            </button>
          ) : (
            <div />
          )}

          {nextDoc && (
            <button
              onClick={() => setActiveDocId(nextDoc.id)}
              className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 text-right transition-colors flex items-center gap-2 group"
            >
              <div>
                <div className="text-[10px] text-neutral-400">Next</div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {nextDoc.title}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
