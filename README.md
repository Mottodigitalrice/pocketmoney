# Executive AI Agent - Demo Template

A production-ready template for building AI-powered web applications with Claude Code.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Database | Convex (real-time) |
| Auth | Clerk |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | OpenRouter |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Accounts: [Convex](https://convex.dev), [Clerk](https://clerk.com), [OpenRouter](https://openrouter.ai)

### Setup

1. **Clone and install:**
   ```bash
   git clone [repo-url] my-project
   cd my-project
   rm -rf .git && git init
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys from Convex, Clerk, and OpenRouter dashboards.

3. **Start development:**
   ```bash
   npm run dev:all
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                # Next.js pages
│   ├── (auth)/         # Sign-in/sign-up
│   ├── (dashboard)/    # Protected routes
│   └── api/            # API routes
├── components/
│   ├── ui/             # shadcn components
│   └── features/       # Feature components
└── lib/                # Utilities

convex/                 # Backend
├── schema.ts           # Database schema
└── functions/          # Queries & mutations

.claude/                # Claude Code config
├── commands/           # Slash commands
├── skills/             # Domain knowledge
└── docs/               # Documentation
```

## Commands

```bash
npm run dev:all      # Start Next.js + Convex together
npm run build        # Production build
npm run deploy       # Deploy to Vercel
```

## Claude Code Integration

This template is optimized for [Claude Code](https://claude.ai/code). The `.claude/` directory contains:

- **commands/** - Custom slash commands (`/init`, `/audit`, `/status`, `/extract`)
- **skills/** - Domain knowledge for Convex, Clerk, OpenRouter, and more
- **docs/** - Architecture and convention documentation

## License

MIT
