import { describe, expect, it } from 'vitest';

import { getPtoDaysForYear } from '@/services/pto-constants';

describe('PTO Constants', () => {
  describe('getPtoDaysForYear', () => {
    it('returns 15 for 2026 or later', () => {
      expect(getPtoDaysForYear(2026)).toBe(15);
      expect(getPtoDaysForYear(2030)).toBe(15);
    });

    it('returns 30 for 2010 or earlier', () => {
      expect(getPtoDaysForYear(2010)).toBe(30);
      expect(getPtoDaysForYear(2005)).toBe(30);
    });

    it('returns correct allotment for specific years', () => {
      expect(getPtoDaysForYear(2024)).toBe(18);
      expect(getPtoDaysForYear(2020)).toBe(23);
      expect(getPtoDaysForYear(2016)).toBe(28);
    });

    it('returns 15 as default for unknown years in range', () => {
      // Years with explicit allotment return their value
      expect(getPtoDaysForYear(2025)).toBe(15);
    });
  });
});
