import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { getDateKey, getTodayKey } from '@/services/dates';
import {
  clearAllData as clearStorage,
  getCategories,
  getFeatureToggles,
  getMusicSettings,
  getNotes,
  getPtoEntries,
  getPtoHolidays,
  getPtoSettings,
  getRunningTimer,
  getTasks,
  getTimeEntries,
  initializeStorage,
  setCategories as saveCategories,
  setFeatureToggles as saveFeatureToggles,
  setMusicSettings as saveMusicSettings,
  setNotes as saveNotes,
  setPtoEntries as savePtoEntries,
  setPtoHolidays as savePtoHolidays,
  setPtoSettings as savePtoSettings,
  setTasks as saveTasks,
  setTimeEntries as saveTimeEntries,
  clearRunningTimer,
  setRunningTimer,
} from '@/services/storage';
import type {
  AppView,
  FeatureToggles,
  Holiday,
  MusicSettings,
  NotesMap,
  PtoEntry,
  PtoSettings,
  RunningTimer,
  Task,
  TimeEntry,
  ToastType,
} from '@/types';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface AppState {
  // Navigation
  activeView: AppView;
  setActiveView: (view: AppView) => void;

  // Feature toggles
  featureToggles: FeatureToggles;
  updateFeatureToggles: (toggles: FeatureToggles) => void;

  // Categories
  categories: string[];
  updateCategories: (cats: string[], renames?: Record<string, string>) => void;

  // Time entries
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  // Running timer
  runningTimer: RunningTimer | null;
  startTimer: (description: string, category: string) => void;
  stopTimer: () => void;

  // Timer view date
  timerViewDate: Date;
  setTimerViewDate: (d: Date) => void;

  // Tasks
  tasks: Task[];
  addTask: (title: string, notes: string) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (fromId: string, toId: string) => void;

  // Notes
  notes: NotesMap;
  saveNote: (dateKey: string, content: string) => void;
  deleteNote: (dateKey: string) => void;

  // PTO
  ptoSettings: PtoSettings | null;
  updatePtoSettings: (settings: PtoSettings) => void;
  ptoEntries: PtoEntry[];
  addPtoEntry: (entry: PtoEntry) => void;
  addPtoEntries: (entries: PtoEntry[]) => void;
  deletePtoEntry: (id: string) => void;
  ptoHolidays: Holiday[];
  updatePtoHolidays: (holidays: Holiday[]) => void;

  // Music
  musicSettings: MusicSettings;
  updateMusicSettings: (settings: MusicSettings) => void;

  // Toast
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType) => void;

  // Data management
  exportData: () => void;
  importData: (data: string) => Promise<void>;
  clearAllData: () => void;

  // Reload trigger
  reloadAll: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize storage on mount
  useEffect(() => {
    initializeStorage();
  }, []);

  // ── State ──
  const [activeView, setActiveView] = useState<AppView>('timer');
  const [featureToggles, setFeatureToggles] =
    useState<FeatureToggles>(getFeatureToggles());
  const [categories, setCategoriesState] = useState<string[]>(getCategories());
  const [timeEntries, setTimeEntriesState] =
    useState<TimeEntry[]>(getTimeEntries());
  const [runningTimer, setRunningTimerState] = useState<RunningTimer | null>(
    getRunningTimer()
  );
  const [timerViewDate, setTimerViewDate] = useState<Date>(new Date());
  const [tasks, setTasksState] = useState<Task[]>(getTasks());
  const [notes, setNotesState] = useState<NotesMap>(getNotes());
  const [ptoSettings, setPtoSettingsState] = useState<PtoSettings | null>(
    getPtoSettings()
  );
  const [ptoEntries, setPtoEntriesState] =
    useState<PtoEntry[]>(getPtoEntries());
  const [ptoHolidays, setPtoHolidaysState] =
    useState<Holiday[]>(getPtoHolidays());
  const [musicSettings, setMusicSettingsState] =
    useState<MusicSettings>(getMusicSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const lastKnownDate = useRef(getTodayKey());

  // ── Toast ──
  const showToast = useCallback((message: string, type: ToastType = '') => {
    const id = ++toastCounter;

    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ── Feature Toggles ──
  const updateFeatureToggles = useCallback(
    (toggles: FeatureToggles) => {
      const enabledCount = Object.values(toggles).filter(Boolean).length;

      if (enabledCount === 0) {
        showToast('You need at least one feature enabled.', 'error');

        return;
      }
      saveFeatureToggles(toggles);
      setFeatureToggles(toggles);
    },
    [showToast]
  );

  // ── Categories ──
  const updateCategories = useCallback(
    (cats: string[], renames?: Record<string, string>) => {
      if (renames && Object.keys(renames).length > 0) {
        const entries = getTimeEntries();
        let changed = false;

        entries.forEach((e) => {
          if (renames[e.category]) {
            e.category = renames[e.category];
            changed = true;
          }
        });

        if (changed) {
          saveTimeEntries(entries);
          setTimeEntriesState([...entries]);
        }
      }
      saveCategories(cats);
      setCategoriesState(cats);
    },
    []
  );

  // ── Time Entries ──
  const addTimeEntry = useCallback((entry: TimeEntry) => {
    setTimeEntriesState((prev) => {
      const next = [...prev, entry];

      saveTimeEntries(next);

      return next;
    });
  }, []);

  const updateTimeEntry = useCallback(
    (id: string, updates: Partial<TimeEntry>) => {
      setTimeEntriesState((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));

        saveTimeEntries(next);

        return next;
      });
    },
    []
  );

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntriesState((prev) => {
      const next = prev.filter((e) => e.id !== id);

      saveTimeEntries(next);

      return next;
    });
  }, []);

  // ── Running Timer ──
  const startTimer = useCallback(
    (description: string, category: string) => {
      if (runningTimer) {
        showToast('A timer is already running. Stop it first.', 'error');

        return;
      }

      const timer: RunningTimer = {
        startTime: new Date().toISOString(),
        description,
        category,
      };

      setRunningTimer(timer);
      setRunningTimerState(timer);
    },
    [runningTimer, showToast]
  );

  const stopTimer = useCallback(() => {
    if (!runningTimer) {
      return;
    }

    const entry: TimeEntry = {
      id: Date.now().toString(),
      description: runningTimer.description,
      category: runningTimer.category,
      startTime: runningTimer.startTime,
      endTime: new Date().toISOString(),
    };

    setTimeEntriesState((prev) => {
      const next = [...prev, entry];

      saveTimeEntries(next);

      return next;
    });

    clearRunningTimer();
    setRunningTimerState(null);
  }, [runningTimer]);

  // ── Tasks ──
  const addTask = useCallback((title: string, taskNotes: string) => {
    setTasksState((prev) => {
      const activeTasks = prev.filter((t) => !t.done);
      const maxOrder = activeTasks.length
        ? Math.max(...activeTasks.map((t) => t.order || 0))
        : -1;

      const task: Task = {
        id: Date.now().toString(),
        title,
        notes: taskNotes,
        date: getDateKey(new Date()),
        done: false,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      const next = [...prev, task];

      saveTasks(next);

      return next;
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasksState((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            done: !t.done,
            completedAt: !t.done ? new Date().toISOString() : null,
          };
        }

        return t;
      });

      saveTasks(next);

      return next;
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasksState((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));

      saveTasks(next);

      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasksState((prev) => {
      const next = prev.filter((t) => t.id !== id);

      saveTasks(next);

      return next;
    });
  }, []);

  const reorderTasks = useCallback((fromId: string, toId: string) => {
    setTasksState((prev) => {
      const undone = prev
        .filter((t) => !t.done)
        .map((t, i) => ({ ...t, order: t.order ?? i }))
        .sort((a, b) => a.order - b.order);

      const fromIdx = undone.findIndex((t) => t.id === fromId);
      const toIdx = undone.findIndex((t) => t.id === toId);

      if (fromIdx === -1 || toIdx === -1) {
        return prev;
      }

      const [moved] = undone.splice(fromIdx, 1);

      undone.splice(toIdx, 0, moved);
      undone.forEach((t, i) => {
        t.order = i;
      });

      const orderMap = new Map(undone.map((t) => [t.id, t.order]));
      const next = prev.map((t) => {
        const newOrder = orderMap.get(t.id);

        return newOrder !== undefined ? { ...t, order: newOrder } : t;
      });

      saveTasks(next);

      return next;
    });
  }, []);

  // ── Notes ──
  const saveNote = useCallback((dateKey: string, content: string) => {
    setNotesState((prev) => {
      const next = { ...prev };

      if (content.trim()) {
        next[dateKey] = content;
      } else {
        delete next[dateKey];
      }

      saveNotes(next);

      return next;
    });
  }, []);

  const deleteNote = useCallback((dateKey: string) => {
    setNotesState((prev) => {
      const next = { ...prev };

      delete next[dateKey];
      saveNotes(next);

      return next;
    });
  }, []);

  // ── PTO ──
  const updatePtoSettings = useCallback((settings: PtoSettings) => {
    savePtoSettings(settings);
    setPtoSettingsState(settings);
  }, []);

  const addPtoEntry = useCallback(
    (entry: PtoEntry) => {
      setPtoEntriesState((prev) => {
        if (prev.find((e) => e.date === entry.date)) {
          showToast('This date is already logged', 'error');

          return prev;
        }

        const next = [...prev, entry];

        savePtoEntries(next);

        return next;
      });
    },
    [showToast]
  );

  const addPtoEntries = useCallback((entries: PtoEntry[]) => {
    setPtoEntriesState((prev) => {
      const existingDates = new Set(prev.map((e) => e.date));
      const newEntries = entries.filter((e) => !existingDates.has(e.date));
      const next = [...prev, ...newEntries];

      savePtoEntries(next);

      return next;
    });
  }, []);

  const deletePtoEntry = useCallback((id: string) => {
    setPtoEntriesState((prev) => {
      const next = prev.filter((e) => e.id !== id);

      savePtoEntries(next);

      return next;
    });
  }, []);

  const updatePtoHolidays = useCallback((holidays: Holiday[]) => {
    const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

    savePtoHolidays(sorted);
    setPtoHolidaysState(sorted);
  }, []);

  // ── Music ──
  const updateMusicSettings = useCallback((settings: MusicSettings) => {
    saveMusicSettings(settings);
    setMusicSettingsState(settings);
  }, []);

  // ── Data Management ──
  const exportData = useCallback(() => {
    const data = {
      version: 4,
      categories,
      entries: timeEntries,
      tasks,
      notes,
      pto: {
        settings: ptoSettings,
        entries: ptoEntries,
        holidays: ptoHolidays,
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `workbench-export-${getDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [
    categories,
    timeEntries,
    tasks,
    notes,
    ptoSettings,
    ptoEntries,
    ptoHolidays,
  ]);

  const importData = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_rawData: string) => {
      // This will be handled in the Settings component with confirm dialog
      // The context just triggers a reload after import
    },
    []
  );

  const reloadAll = useCallback(() => {
    setCategoriesState(getCategories());
    setTimeEntriesState(getTimeEntries());
    setRunningTimerState(getRunningTimer());
    setTasksState(getTasks());
    setNotesState(getNotes());
    setPtoSettingsState(getPtoSettings());
    setPtoEntriesState(getPtoEntries());
    setPtoHolidaysState(getPtoHolidays());
    setFeatureToggles(getFeatureToggles());
    setMusicSettingsState(getMusicSettings());
  }, []);

  const clearAllDataFn = useCallback(() => {
    clearStorage();
  }, []);

  // ── Day Change Detection ──
  useEffect(() => {
    const check = () => {
      const currentDate = getTodayKey();

      if (currentDate !== lastKnownDate.current) {
        lastKnownDate.current = currentDate;
        setTimerViewDate(new Date());
        setNotesState(getNotes());
      }
    };

    const interval = setInterval(check, 30000);
    const handleVisibility = () => {
      if (!document.hidden) {
        check();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // ── Auto-switch if active view is toggled off ──
  useEffect(() => {
    if (!featureToggles[activeView]) {
      const first = (
        Object.entries(featureToggles) as [AppView, boolean][]
      ).find(([, v]) => v);

      if (first) {
        setActiveView(first[0]);
      }
    }
  }, [featureToggles, activeView]);

  const value: AppState = useMemo(
    () => ({
      activeView,
      setActiveView,
      featureToggles,
      updateFeatureToggles,
      categories,
      updateCategories,
      timeEntries,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      runningTimer,
      startTimer,
      stopTimer,
      timerViewDate,
      setTimerViewDate,
      tasks,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      reorderTasks,
      notes,
      saveNote,
      deleteNote,
      ptoSettings,
      updatePtoSettings,
      ptoEntries,
      addPtoEntry,
      addPtoEntries,
      deletePtoEntry,
      ptoHolidays,
      updatePtoHolidays,
      musicSettings,
      updateMusicSettings,
      toasts,
      showToast,
      exportData,
      importData,
      clearAllData: clearAllDataFn,
      reloadAll,
    }),
    [
      activeView,
      featureToggles,
      updateFeatureToggles,
      categories,
      updateCategories,
      timeEntries,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      runningTimer,
      startTimer,
      stopTimer,
      timerViewDate,
      tasks,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      reorderTasks,
      notes,
      saveNote,
      deleteNote,
      ptoSettings,
      updatePtoSettings,
      ptoEntries,
      addPtoEntry,
      addPtoEntries,
      deletePtoEntry,
      ptoHolidays,
      updatePtoHolidays,
      musicSettings,
      updateMusicSettings,
      toasts,
      showToast,
      exportData,
      importData,
      clearAllDataFn,
      reloadAll,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }

  return ctx;
}
