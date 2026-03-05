/**
 * Date and time formatting utilities used throughout the app.
 */

export function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

export function getTodayKey(): string {
  return getDateKey(new Date());
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');

  return `${h}:${m}:${sec}`;
}

export function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) {
    return '';
  }

  const d = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatPtoDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

export function formatPtoDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

  return `${month} ${day} (${weekday})`;
}

export function formatPtoDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);

  return new Date(year, month - 1, day);
}
