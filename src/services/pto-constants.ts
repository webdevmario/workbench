import type { Holiday } from '@/types';

export const PTO_YEAR = 2026;

export const PTO_ALLOTMENT: Record<number, number> = {
  2026: 15,
  2025: 15,
  2024: 18,
  2023: 20,
  2022: 21,
  2021: 22,
  2020: 23,
  2019: 24,
  2018: 25,
  2017: 26,
  2016: 28,
  2015: 28,
  2014: 28,
  2013: 28,
  2012: 28,
  2011: 28,
  2010: 30,
};

export const DEFAULT_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: "New Year's Day", note: 'CLOSED' },
  { date: '2026-01-19', name: 'MLK Jr. Day', note: 'CLOSED' },
  { date: '2026-04-03', name: 'Good Friday', note: 'CLOSED' },
  { date: '2026-05-25', name: 'Memorial Day', note: 'CLOSED' },
  { date: '2026-06-19', name: 'Juneteenth', note: 'CLOSED' },
  { date: '2026-07-03', name: 'Independence Day', note: 'CLOSED' },
  { date: '2026-09-07', name: 'Labor Day', note: 'CLOSED' },
  {
    date: '2026-11-25',
    name: 'Day Before Thanksgiving',
    note: 'CLOSED 1PM',
  },
  { date: '2026-11-26', name: 'Thanksgiving', note: 'CLOSED' },
  { date: '2026-11-27', name: 'Day After Thanksgiving', note: 'CLOSED' },
  { date: '2026-12-24', name: 'Christmas Eve', note: 'CLOSED' },
  { date: '2026-12-25', name: 'Christmas Day', note: 'CLOSED' },
  { date: '2026-12-28', name: 'Extended Holiday', note: 'Volunteers' },
  { date: '2026-12-29', name: 'Extended Holiday', note: 'Volunteers' },
  { date: '2026-12-30', name: 'Extended Holiday', note: 'Volunteers' },
  { date: '2026-12-31', name: "New Year's Eve", note: 'Volunteers' },
];

export function getPtoDaysForYear(startYear: number): number {
  if (startYear >= 2026) {
    return 15;
  }

  if (startYear <= 2010) {
    return 30;
  }

  return PTO_ALLOTMENT[startYear] || 15;
}
