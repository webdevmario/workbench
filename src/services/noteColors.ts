import type { NoteColor } from '@/types';

export const NOTE_COLORS: Record<NoteColor, { strip: string; body: string }> = {
  teal: { strip: '#00c49a', body: 'rgba(0,196,154,0.07)' },
  violet: { strip: '#818cf8', body: 'rgba(129,140,248,0.07)' },
  amber: { strip: '#fb923c', body: 'rgba(251,146,60,0.07)' },
  pink: { strip: '#e879a0', body: 'rgba(232,121,160,0.07)' },
  blue: { strip: '#60a5fa', body: 'rgba(96,165,250,0.07)' },
};

/**
 * Shared note color palette. Keys are persisted on each note; the CSS values
 * are used by the UI. Kept here (not in the component) so the storage layer can
 * assign colors during migration / new-note creation without importing UI code.
 */
export const NOTE_COLOR_KEYS: NoteColor[] = [
  'teal',
  'violet',
  'amber',
  'pink',
  'blue',
];

/** Deterministic color key from an arbitrary string (used during migration). */
export function colorForKey(key: string): NoteColor {
  let h = 0;

  for (const c of key) {
    h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  }

  return NOTE_COLOR_KEYS[h % NOTE_COLOR_KEYS.length];
}
