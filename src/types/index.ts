export type AppView = 'timer' | 'tasks' | 'notes' | 'pto' | 'music';

// ── Feature Toggles ──
export interface FeatureToggles {
  timer: boolean;
  tasks: boolean;
  notes: boolean;
  pto: boolean;
  music: boolean;
}

export interface Holiday {
  date: string;
  name: string;
  note: string;
}

// ── Music Types ──
export interface MusicSettings {
  playlistUrl: string;
}

// ── Notes Types ──
export type NotesMap = Record<string, string>;

export interface PtoEntry {
  id: string;
  date: string;
  type: 'vacation' | 'sick';
  notes: string;
  confirmedAt: string;
  manual?: boolean;
}

// ── PTO Types ──
export interface PtoSettings {
  startYear: number;
  rolloverDays: number;
  initials: string;
  supervisorName: string;
  supervisorEmail: string;
  excludeRollover: boolean;
}

export interface RunningTimer {
  startTime: string;
  description: string;
  category: string;
}

// ── Stats ──
export type StatsPeriod = 'week' | 'month' | 'all';

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

// ── Time Tracker Types ──
export interface TimeEntry {
  id: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
}

// ── Toast ──
export type ToastType = 'success' | 'error' | '';

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
