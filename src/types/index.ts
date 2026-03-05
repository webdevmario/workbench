// ── Time Tracker Types ──

export interface TimeEntry {
  id: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
}

export interface RunningTimer {
  startTime: string;
  description: string;
  category: string;
}

// ── Task Types ──

export interface Task {
  id: string;
  title: string;
  notes: string;
  date: string;
  done: boolean;
  order: number;
  createdAt: string;
  completedAt: string | null;
}

export type TaskFilter = 'active' | 'all' | 'done';

// ── Notes Types ──

export type NotesMap = Record<string, string>;

// ── PTO Types ──

export interface PtoSettings {
  startYear: number;
  rolloverDays: number;
  initials: string;
  supervisorName: string;
  supervisorEmail: string;
  excludeRollover: boolean;
}

export interface PtoEntry {
  id: string;
  date: string;
  type: 'vacation' | 'sick';
  notes: string;
  confirmedAt: string;
  manual?: boolean;
}

export interface Holiday {
  date: string;
  name: string;
  note: string;
}

// ── Feature Toggles ──

export interface FeatureToggles {
  timer: boolean;
  tasks: boolean;
  notes: boolean;
  pto: boolean;
}

export type AppView = 'timer' | 'tasks' | 'notes' | 'pto';

// ── Stats ──

export type StatsPeriod = 'week' | 'month' | 'all';

// ── Export/Import ──

export interface WorkbenchExport {
  version: number;
  categories: string[];
  entries: TimeEntry[];
  tasks: Task[];
  notes: NotesMap;
  pto: {
    settings: PtoSettings | null;
    entries: PtoEntry[];
    holidays: Holiday[];
  };
  exportedAt: string;
}

// ── Toast ──

export type ToastType = 'success' | 'error' | '';
