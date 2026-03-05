/**
 * Storage service for managing localStorage data.
 * All localStorage keys are prefixed with 'wb_' to avoid collisions.
 * This preserves backward compatibility with v1 data format.
 */

import type {
  FeatureToggles,
  Holiday,
  NotesMap,
  PtoEntry,
  PtoSettings,
  RunningTimer,
  Task,
  TimeEntry,
} from '@/types';

const KEYS = {
  categories: 'wb_categories',
  entries: 'wb_timeEntries',
  featureToggles: 'wb_featureToggles',
  notes: 'wb_notes',
  ptoEntries: 'wb_ptoEntries',
  ptoHolidays: 'wb_ptoHolidays',
  ptoSettings: 'wb_ptoSettings',
  runningTimer: 'wb_runningTimer',
  tasks: 'wb_tasks',
} as const;

// ── Generic Helpers ──

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  localStorage.removeItem(key);
}

// ── Categories ──

const DEFAULT_CATEGORIES = [
  'Code Review',
  'Development',
  'Documentation',
  'Meeting',
  'Project Management',
  'Technical Assistance',
];

export function getCategories(): string[] {
  return getItem<string[]>(KEYS.categories, DEFAULT_CATEGORIES);
}

export function setCategories(categories: string[]): void {
  setItem(KEYS.categories, categories);
}

// ── Time Entries ──

export function getTimeEntries(): TimeEntry[] {
  return getItem<TimeEntry[]>(KEYS.entries, []);
}

export function setTimeEntries(entries: TimeEntry[]): void {
  setItem(KEYS.entries, entries);
}

// ── Running Timer ──

export function getRunningTimer(): RunningTimer | null {
  return getItem<RunningTimer | null>(KEYS.runningTimer, null);
}

export function setRunningTimer(timer: RunningTimer): void {
  setItem(KEYS.runningTimer, timer);
}

export function clearRunningTimer(): void {
  removeItem(KEYS.runningTimer);
}

// ── Tasks ──

export function getTasks(): Task[] {
  return getItem<Task[]>(KEYS.tasks, []);
}

export function setTasks(tasks: Task[]): void {
  setItem(KEYS.tasks, tasks);
}

// ── Notes ──

export function getNotes(): NotesMap {
  return getItem<NotesMap>(KEYS.notes, {});
}

export function setNotes(notes: NotesMap): void {
  setItem(KEYS.notes, notes);
}

// ── PTO ──

export function getPtoSettings(): PtoSettings | null {
  return getItem<PtoSettings | null>(KEYS.ptoSettings, null);
}

export function setPtoSettings(settings: PtoSettings): void {
  setItem(KEYS.ptoSettings, settings);
}

export function getPtoEntries(): PtoEntry[] {
  return getItem<PtoEntry[]>(KEYS.ptoEntries, []);
}

export function setPtoEntries(entries: PtoEntry[]): void {
  setItem(KEYS.ptoEntries, entries);
}

export function getPtoHolidays(): Holiday[] {
  return getItem<Holiday[]>(KEYS.ptoHolidays, []);
}

export function setPtoHolidays(holidays: Holiday[]): void {
  setItem(KEYS.ptoHolidays, holidays);
}

// ── Feature Toggles ──

const DEFAULT_TOGGLES: FeatureToggles = {
  timer: true,
  tasks: true,
  notes: true,
  pto: true,
};

export function getFeatureToggles(): FeatureToggles {
  return getItem<FeatureToggles>(KEYS.featureToggles, DEFAULT_TOGGLES);
}

export function setFeatureToggles(toggles: FeatureToggles): void {
  setItem(KEYS.featureToggles, toggles);
}

// ── Data Management ──

export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => removeItem(key));
}

export function migrateOldData(): void {
  // Migrate legacy keys (no wb_ prefix) to new format
  const legacyMap: Record<string, string> = {
    timeEntries: KEYS.entries,
    categories: KEYS.categories,
    runningTimer: KEYS.runningTimer,
  };

  Object.entries(legacyMap).forEach(([oldKey, newKey]) => {
    const oldData = localStorage.getItem(oldKey);

    if (oldData && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldData);
    }
  });
}

// ── Initialize ──

export function initializeStorage(): void {
  migrateOldData();

  if (!localStorage.getItem(KEYS.categories)) {
    setCategories(DEFAULT_CATEGORIES);
  }
}
