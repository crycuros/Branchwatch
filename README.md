# BranchWatch

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-chardiii0330-orange.svg?logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/chardiii0330)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A visual graph editor and execution runtime for Git repositories.

Git is fundamentally a directed acyclic graph (DAG), but developers are forced to interact with it through sequential terminal strings. BranchWatch bridges that gap by modeling Git operations as strongly-typed graph nodes—allowing engineers to compose, inspect, validate, and dry-run Git workflows before committing or pushing changes to remote repositories.

---

## Why BranchWatch?

- **Prevent Broken Branch Topologies**: Build branches and staging pipelines visually. The connection engine prevents cycles, self-references, and invalid state transitions before commands run.
- **Pre-Flight Dry Runs**: Inspect the exact shell commands generated from the node topology (`git add`, `git commit`, `git switch`, `git push`) with topological step ordering and simulated output.
- **Live Repository Hydration**: Pulls active branches, commit histories, author metadata, and line diff statistics directly from GitHub.
- **Safe Authentication**: Credentials never leak in URL parameters. All tokens are securely stored in server-validated HttpOnly cookies with CSRF state verification.

---

## The Node Pipeline & Port Type System

Every node on the canvas accepts and produces semantic Git artifacts. Connections are validated in real-time based on port data types:

```text
[ Working Tree ]
       │  (WorkingTreeChanges)
       ▼
   [ Stage ]
       │  (StagedChanges)
       ▼
   [ Commit ]
       │  (CommitRef)
       ├───► [ Branch ] ───► [ Push ] (RemoteRef)
       └───► [ Push ] (RemoteRef)
```

| Node Type | Accepts (Input) | Emits (Output) | Description |
|:---|:---|:---|:---|
| **Working Tree** | *None* | `WorkingTreeChanges` | Uncommitted file changes and line additions/deletions. |
| **Stage** | `WorkingTreeChanges` | `StagedChanges` | Tracks index staging (`git add <files>` or `git add .`). |
| **Commit** | `StagedChanges` | `CommitRef` | Generates commit object with message, author, and timestamp. |
| **Branch** | `CommitRef` | `BranchRef` | Switches or points branch HEAD to specific commit references. |
| **Push** | `BranchRef` / `CommitRef` | `RemoteRef` | Publishes commits upstream to specified remote repository. |
| **Pull** | `BranchRef` | `WorkingTreeChanges` | Fetches and merges remote changes into local working tree. |

---

## Keyboard Shortcuts

| Shortcut (Win / Linux) | Shortcut (macOS) | Action |
|:---|:---|:---|
| `Ctrl + K` | `⌘ + K` | Open global repository & branch search |
| `Space + Drag` | `Space + Drag` | Pan canvas workspace |
| `Ctrl + Scroll` | `⌘ + Scroll` | Zoom in / Zoom out |
| `Ctrl + Z` | `⌘ + Z` | Undo canvas changes |
| `Ctrl + Shift + Z` | `⌘ + Shift + Z` | Redo canvas changes |
| `Delete` / `Backspace` | `Delete` / `Backspace` | Remove selected node |
| `Escape` | `Escape` | Close inspection drawer / Exit modal |

---

## Local Development

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/crycuros/Branchwatch.git
   cd Branchwatch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your GitHub OAuth App credentials (created in GitHub Developer Settings with `http://localhost:3000/api/auth/callback/github` as callback URL):
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## Support

If you find BranchWatch useful for your development workflow, you can support its continued maintenance:

- **Buy Me a Coffee**: [buymeacoffee.com/chardiii0330](https://buymeacoffee.com/chardiii0330)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
