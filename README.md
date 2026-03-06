# Workbench

A personal productivity app for time tracking, tasks, notes, and PTO management. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Time Tracker** — Start/stop timer with categories, daily summaries, edit entries, resume previous tasks
- **Tasks** — Task lists with drag-and-drop reordering, completion animations, filter by status
- **Notes** — Daily markdown notes with formatting toolbar, auto-save, and full-text search
- **PTO** — Track paid time off, see remaining balance, manage holidays, generate request emails
- **Stats** — View time breakdown by category with week/month/all-time period filters
- **Settings** — Feature toggles, data import/export, keyboard shortcuts, danger zone

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens at `http://localhost:5500`. All data is stored locally in your browser's localStorage.

## Migrating from v1

If you're coming from the single-file HTML version:

1. Open the old version and go to Settings → Export Data
2. Open this new version and go to Settings → Data → Import Data
3. Select your exported JSON file — all your data transfers seamlessly

Both versions use the same `wb_*` localStorage keys, so if you're running on the same domain, your data will already be there.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint (strict — zero warnings) |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without changes |
| `npm run typecheck` | TypeScript compiler check |
| `npm run test` | Run test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run validate` | Full CI pipeline: types + lint + format + tests |

## Tech Stack

- **React 18** with functional components and hooks
- **TypeScript** in strict mode
- **Vite** for blazing-fast dev server and optimized builds
- **Tailwind CSS** for utility-first styling
- **Vitest** + **React Testing Library** for testing
- **ESLint** + **Prettier** for code quality
- **localStorage** for zero-backend persistence

## Project Structure

```
workbench/
├── src/
│   ├── components/       # UI components by feature
│   │   ├── layout/       # AppShell, Header, AppNav
│   │   ├── timer/        # Time tracker with entries
│   │   ├── tasks/        # Task management
│   │   ├── notes/        # Note editor with search
│   │   ├── pto/          # PTO tracker
│   │   ├── stats/        # Statistics modal
│   │   ├── settings/     # App settings
│   │   └── shared/       # Modal, Toast, ConfirmDialog
│   ├── contexts/         # React context (AppContext)
│   ├── services/         # Business logic & storage
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global CSS + Tailwind
│   └── test/             # Test setup
├── .vscode/              # Editor settings
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tailwind.config.js    # Tailwind theme + animations
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── vitest.config.ts      # Test configuration
└── CLAUDE.md             # AI assistant instructions
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl + 1-4` | Switch between tabs |
| `⌘/Ctrl + K` | Quick add task |
| `⌘/Ctrl + J` | New note |
| `⌘/Ctrl + /` | Search notes |
| `⌘/Ctrl + S` | Save (in modals) |
| `⌘/Ctrl + Enter` | Save & close note |
| `Escape` | Close modal/search |

## Data

All data persists in localStorage under `wb_*` prefixed keys. Use Settings → Export Data to create a JSON backup anytime. The export includes time entries, tasks, notes, categories, PTO data, and settings.

## License

ISC
