# Workbench

A personal productivity app for time tracking, tasks, notes, and PTO management.

## Features

- **Time Tracker** — Start/stop timer with categories, daily summaries, edit entries
- **Tasks** — Daily task lists with drag-and-drop reordering, carryover for unfinished tasks
- **Notes** — Daily markdown notes with live preview
- **PTO** — Track paid time off, see remaining balance, generate request emails
- **Stats** — View time breakdown by category with period filters

## Quick Start

Open `workbench.html` in your browser. All data is stored locally in your browser's localStorage.

## Hosting

```bash
cd ~/workbench
python3 -m http.server 8080
```

Then access via `http://<ip-address>:8080`

## Data

**Export/Import:** Settings → Export Data creates a JSON backup of everything. Use Import to restore or transfer to another machine.

**Clear Data:** Settings → Danger Zone → Clear All Data to start fresh.

## Tech

Single HTML file, no dependencies, no build step. Uses localStorage for persistence.