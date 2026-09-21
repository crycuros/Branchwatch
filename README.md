# BranchWatch

Visual Git workflow builder, commit lineage tracker, and branch intelligence platform with live GitHub synchronization and safe execution.

---

## Overview

BranchWatch is a developer-focused platform designed to make Git workflows visual, understandable, and safe. It enables engineers to design branch workflows on an interactive canvas, inspect commit histories, preview generated shell commands with dry-run verification, and manage repository state with zero guesswork.

---

## Key Capabilities

- **Visual Git Canvas Engine**: Interactive node-based canvas supporting Working Tree, Staging, Commit, Branch, Push, and Pull operations with strict port connection validation.
- **Live GitHub Repository Sync**: Real-time hydration of repository state, commit lineage, author metadata, and code addition/deletion statistics.
- **Dry-Run Command Review**: Generates topological execution orders and displays terminal command previews before changes take place.
- **Commit History & Lineage**: Detailed inspection drawers for commits, branches, and diff summaries.
- **Branch Intelligence & Graph**: Visual representation of branch divergence, active branches, and repository activity.
- **Enterprise-Grade Security**: Server-side HttpOnly cookie sessions, CSRF protection with state tokens, and strict HTTP security headers.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: GitHub OAuth with HttpOnly Session Cookies

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- GitHub Personal Access Token or GitHub OAuth App Credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/crycuros/branchwatch.git
   cd branchwatch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and set your GitHub OAuth credentials:
   ```bash
   cp .env.example .env.local
   ```

   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture & Layout

```text
src/
├── app/
│   ├── api/auth/          # OAuth callback, session, and logout handlers
│   ├── globals.css        # Theme variables, typography, and motion tokens
│   ├── layout.tsx         # Root layout configuration
│   └── page.tsx           # Main application workspace and view controller
├── components/
│   ├── ui/                # Base primitives (Buttons, Badges, Brand Logo)
│   ├── visual/            # Visual Git Workflow engine (Canvas, Nodes, Inspector)
│   └── v3/                # Git Graph, Diff Viewer, and Split View components
└── lib/
    ├── github.ts          # GitHub REST API client functions
    ├── nodeValidation.ts  # Typed port and connection validation rules
    ├── workflowExecutor.ts# Topological execution engine and terminal simulator
    └── workflowTypes.ts   # Core TypeScript interfaces
```

---

## Support

If you find BranchWatch useful, you can support its continued development:

- Buy Me a Coffee: [buymeacoffee.com/chardiii0330](https://buymeacoffee.com/chardiii0330)

---

## License

MIT License. See LICENSE for details.

