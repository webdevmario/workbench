# CLAUDE.md — Workbench

## Project Overview

Workbench is a personal productivity app built with React 18, TypeScript, Vite, and Tailwind CSS. It provides time tracking, task management, daily notes, and PTO tracking — all stored in localStorage for zero-backend simplicity.

## Architecture

```
src/
├── components/          # React components organized by feature
│   ├── layout/          # AppShell, Header, AppNav
│   ├── timer/           # TimerView and sub-components
│   ├── tasks/           # TasksView with drag-and-drop
│   ├── notes/           # NotesView with markdown editor and search
│   ├── pto/             # PtoView with calendar and settings
│   ├── stats/           # StatsModal with period filtering
│   ├── settings/        # SettingsModal with feature toggles, data import/export
│   └── shared/          # Modal, ConfirmDialog, Toast
├── contexts/            # AppContext — single global state provider
├── services/            # Storage service, date utilities, PTO constants
├── types/               # TypeScript interfaces and types
├── styles/              # Global CSS (Tailwind base + custom animations)
└── test/                # Test setup (jsdom, localStorage mock)
```

## Key Patterns

- **State management**: Single `AppContext` wraps the entire app. All state reads/writes go through this context. No direct localStorage calls from components.
- **Storage layer**: `services/storage.ts` is the only file that touches localStorage. All keys are prefixed with `wb_` to avoid collisions.
- **Data compatibility**: v1 (single HTML file) and v2 (this React app) share the same localStorage schema. Users can import/export between them seamlessly.
- **Path aliases**: `@/` maps to `src/` — use this for all imports instead of relative paths.

## Commands

```bash
npm run dev            # Start dev server on port 5500
npm run build          # TypeScript check + Vite build
npm run lint           # ESLint check (zero warnings allowed)
npm run lint:fix       # Auto-fix lint issues
npm run format         # Format all source files with Prettier
npm run format:check   # Check formatting without changing files
npm run typecheck      # TypeScript compiler check (no emit)
npm run test           # Run all tests once
npm run test:watch     # Watch mode for tests
npm run test:coverage  # Generate coverage report
npm run validate       # Full CI check: typecheck + lint + format + test
```

## Coding Standards

- **TypeScript**: Strict mode. No `any` types. All props typed with interfaces.
- **ESLint**: Uses `@typescript-eslint`, `react`, `import`, `jsx-a11y`, `prettier` plugins. Import order enforced alphabetically with grouping.
- **Prettier**: Single quotes, trailing commas (es5), 80 char width, Tailwind class sorting plugin.
- **Testing**: Vitest + React Testing Library + jsdom. Tests co-located next to source files (e.g., `storage.test.ts`).
- **Components**: Functional components only. Hooks for state/effects. No class components.
- **Styling**: Tailwind utility classes exclusively. Custom CSS only for animations and browser-specific things. Design tokens in `tailwind.config.js`.

## Data Model

All data lives in localStorage under `wb_*` keys:

| Key | Type | Description |
|---|---|---|
| `wb_timeEntries` | `TimeEntry[]` | Time tracking entries |
| `wb_categories` | `string[]` | Timer categories |
| `wb_runningTimer` | `RunningTimer \| null` | Currently active timer |
| `wb_tasks` | `Task[]` | Task items with ordering |
| `wb_notes` | `Record<string, string>` | Date-keyed markdown notes |
| `wb_ptoSettings` | `PtoSettings \| null` | PTO configuration |
| `wb_ptoEntries` | `PtoEntry[]` | Logged PTO days |
| `wb_ptoHolidays` | `Holiday[]` | Company holidays |
| `wb_featureToggles` | `FeatureToggles` | Which features are visible |

## Import/Export

The app exports JSON with `version: 4` including all data. Import supports merge (keeps existing, adds new) or replace. This is backward-compatible with v1 exports — just open the new app and import your v1 export file.

## Adding Features

1. Define types in `src/types/index.ts`
2. Add storage functions in `src/services/storage.ts`
3. Add state + actions to `src/contexts/AppContext.tsx`
4. Create component in the appropriate feature directory
5. Write tests alongside the source
6. Run `npm run validate` before committing
