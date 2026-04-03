import { describe, expect, it, beforeEach } from 'vitest';

import {
  clearAllData,
  getCategories,
  getFeatureToggles,
  getNotes,
  getPtoEntries,
  getRunningTimer,
  getTasks,
  getTimeEntries,
  initializeStorage,
  setCategories,
  setFeatureToggles,
  setNotes,
  setRunningTimer,
  clearRunningTimer,
  setTasks,
  setTimeEntries,
} from '@/services/storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Categories', () => {
    it('returns default categories when none are stored', () => {
      const cats = getCategories();

      expect(cats).toContain('Development');
      expect(cats).toContain('Meeting');
      expect(cats.length).toBe(6);
    });

    it('saves and retrieves categories', () => {
      setCategories(['A', 'B', 'C']);
      expect(getCategories()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('Time Entries', () => {
    it('returns empty array when no entries exist', () => {
      expect(getTimeEntries()).toEqual([]);
    });

    it('saves and retrieves time entries', () => {
      const entries = [
        {
          id: '1',
          description: 'Test',
          category: 'Dev',
          startTime: '2026-01-01T09:00:00Z',
          endTime: '2026-01-01T10:00:00Z',
        },
      ];

      setTimeEntries(entries);
      expect(getTimeEntries()).toEqual(entries);
    });
  });

  describe('Running Timer', () => {
    it('returns null when no timer is running', () => {
      expect(getRunningTimer()).toBeNull();
    });

    it('saves and retrieves running timer', () => {
      const timer = {
        startTime: '2026-01-01T09:00:00Z',
        description: 'Working',
        category: 'Dev',
      };

      setRunningTimer(timer);
      expect(getRunningTimer()).toEqual(timer);
    });

    it('clears running timer', () => {
      setRunningTimer({
        startTime: '2026-01-01T09:00:00Z',
        description: 'Working',
        category: 'Dev',
      });
      clearRunningTimer();
      expect(getRunningTimer()).toBeNull();
    });
  });

  describe('Tasks', () => {
    it('returns empty array when no tasks exist', () => {
      expect(getTasks()).toEqual([]);
    });

    it('saves and retrieves tasks', () => {
      const tasks = [
        {
          id: '1',
          title: 'Test Task',
          notes: '',
          date: '2026-01-01',
          done: false,
          order: 0,
          createdAt: '2026-01-01T09:00:00Z',
          completedAt: null,
        },
      ];

      setTasks(tasks);
      expect(getTasks()).toEqual(tasks);
    });
  });

  describe('Notes', () => {
    it('returns empty object when no notes exist', () => {
      expect(getNotes()).toEqual({});
    });

    it('saves and retrieves notes', () => {
      const notes = { '2026-01-01': 'Hello world' };

      setNotes(notes);
      expect(getNotes()).toEqual(notes);
    });
  });

  describe('Feature Toggles', () => {
    it('returns all-enabled defaults', () => {
      const toggles = getFeatureToggles();

      expect(toggles.timer).toBe(true);
      expect(toggles.tasks).toBe(true);
      expect(toggles.notes).toBe(true);
      expect(toggles.pto).toBe(true);
    });

    it('saves and retrieves feature toggles', () => {
      setFeatureToggles({
        timer: true,
        tasks: false,
        notes: true,
        pto: false,
        music: false,
      });
      const result = getFeatureToggles();

      expect(result.tasks).toBe(false);
      expect(result.pto).toBe(false);
    });
  });

  describe('PTO', () => {
    it('returns empty PTO entries', () => {
      expect(getPtoEntries()).toEqual([]);
    });
  });

  describe('Data Management', () => {
    it('clears all data', () => {
      setCategories(['Test']);
      setTimeEntries([
        {
          id: '1',
          description: 'Test',
          category: 'Test',
          startTime: '',
          endTime: '',
        },
      ]);
      clearAllData();

      expect(getCategories()).toContain('Development'); // back to defaults
      expect(getTimeEntries()).toEqual([]);
    });

    it('initializes storage with defaults', () => {
      initializeStorage();
      expect(getCategories().length).toBeGreaterThan(0);
    });
  });
});
