import { describe, expect, it } from 'vitest';

import {
  formatDateLabel,
  formatRelativeDate,
  formatTime,
  formatTimeShort,
  getDateKey,
  parseDateKey,
} from '@/services/dates';

describe('Date Utilities', () => {
  describe('getDateKey', () => {
    it('formats date as YYYY-MM-DD', () => {
      const d = new Date(2026, 0, 5); // Jan 5, 2026

      expect(getDateKey(d)).toBe('2026-01-05');
    });

    it('pads single-digit months and days', () => {
      const d = new Date(2026, 2, 3); // Mar 3

      expect(getDateKey(d)).toBe('2026-03-03');
    });
  });

  describe('formatTime', () => {
    it('formats milliseconds as HH:MM:SS', () => {
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(3661000)).toBe('01:01:01');
      expect(formatTime(36000000)).toBe('10:00:00');
    });
  });

  describe('formatTimeShort', () => {
    it('formats date as short time string', () => {
      const d = new Date(2026, 0, 1, 14, 30);
      const result = formatTimeShort(d);

      expect(result).toContain('2:30');
      expect(result).toContain('PM');
    });
  });

  describe('formatDateLabel', () => {
    it('formats date with weekday, month, and day', () => {
      const d = new Date(2026, 0, 5); // Monday, Jan 5

      expect(formatDateLabel(d)).toContain('Jan');
      expect(formatDateLabel(d)).toContain('5');
    });
  });

  describe('formatRelativeDate', () => {
    it('returns empty string for empty input', () => {
      expect(formatRelativeDate('')).toBe('');
    });

    it('returns "Today" for today', () => {
      const today = new Date().toISOString();

      expect(formatRelativeDate(today)).toBe('Today');
    });
  });

  describe('parseDateKey', () => {
    it('parses YYYY-MM-DD into a Date object', () => {
      const d = parseDateKey('2026-03-15');

      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2); // 0-indexed
      expect(d.getDate()).toBe(15);
    });
  });
});
