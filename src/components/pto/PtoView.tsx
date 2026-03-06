import { useCallback, useMemo, useState } from 'react';

import { ConfirmDialog, Modal } from '@/components/shared';

import { useApp } from '@/contexts/AppContext';

import {
  formatPtoDate,
  formatPtoDateLong,
  getTodayKey,
} from '@/services/dates';
import { getPtoDaysForYear } from '@/services/pto-constants';

import type { Holiday, PtoEntry } from '@/types';

export function PtoView() {
  const { ptoSettings } = useApp();

  if (!ptoSettings) {
    return <PtoSetup />;
  }

  return <PtoMain />;
}

// ── Setup Screen ──

function PtoSetup() {
  const { updatePtoSettings, showToast } = useApp();
  const [startYear, setStartYear] = useState(2026);
  const [rollover, setRollover] = useState(8);
  const [initials, setInitials] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [email, setEmail] = useState('');

  const years = Array.from({ length: 30 }, (_, i) => 2026 - i);

  const handleSetup = () => {
    if (!initials.trim() || !supervisor.trim()) {
      showToast('Please fill in all fields', 'error');

      return;
    }
    updatePtoSettings({
      startYear,
      rolloverDays: rollover,
      initials: initials.trim(),
      supervisorName: supervisor.trim(),
      supervisorEmail: email.trim(),
      excludeRollover: true,
    });
    showToast('PTO setup complete!', 'success');
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-wb-border bg-wb-surface p-12 text-center">
      <div className="mb-4 text-5xl">📅</div>
      <h3 className="mb-3 text-xl font-semibold">Set Up PTO Tracking</h3>
      <p className="mx-auto mb-6 max-w-[400px] text-wb-text-muted">
        Track your paid time off, see your remaining balance, and generate PTO
        request emails.
      </p>
      <div className="mx-auto max-w-sm space-y-4">
        <InputField label="Year Employment Started">
          <select
            className="w-full cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setStartYear(Number(e.target.value))}
            value={startYear}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </InputField>
        <InputField label="Rollover Days (max 8)">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            max={8}
            min={0}
            onChange={(e) => setRollover(Number(e.target.value))}
            type="number"
            value={rollover}
          />
        </InputField>
        <InputField label="Your Initials">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            maxLength={5}
            onChange={(e) => setInitials(e.target.value)}
            placeholder="e.g., JD"
            type="text"
            value={initials}
          />
        </InputField>
        <InputField label="Supervisor Name">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setSupervisor(e.target.value)}
            placeholder="e.g., Jane"
            type="text"
            value={supervisor}
          />
        </InputField>
        <InputField label="Supervisor Email">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., manager@company.com"
            type="email"
            value={email}
          />
        </InputField>
        <button
          className="w-full rounded-lg bg-wb-accent py-3.5 font-medium text-wb-bg transition-all hover:brightness-110"
          onClick={handleSetup}
          type="button"
        >
          Save & Get Started
        </button>
      </div>
    </div>
  );
}

// ── Main PTO View ──

function PtoMain() {
  const {
    ptoSettings,
    ptoEntries,
    ptoHolidays,
    addPtoEntry,
    addPtoEntries,
    deletePtoEntry,
    updatePtoSettings,
    updatePtoHolidays,
    showToast,
  } = useApp();

  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteHolidayIdx, setConfirmDeleteHolidayIdx] = useState<
    number | null
  >(null);
  const [editHolidayIdx, setEditHolidayIdx] = useState<number | null>(null);

  if (!ptoSettings) {
    return null;
  }

  const todayKey = getTodayKey();
  const baseDays = getPtoDaysForYear(ptoSettings.startYear);
  const totalDays = baseDays + ptoSettings.rolloverDays;
  const usedDays = ptoEntries.length;
  const remainingDays = totalDays - usedDays;
  const pctDenom = ptoSettings.excludeRollover ? baseDays : totalDays;
  const usedPct = pctDenom > 0 ? ((usedDays / pctDenom) * 100).toFixed(1) : '0';
  const usingRollover = usedDays > baseDays;
  const rolloverUsed = usingRollover ? usedDays - baseDays : 0;
  const rolloverRemaining = (ptoSettings.rolloverDays || 0) - rolloverUsed;

  // Days since last PTO for nudge
  let daysSinceLastPto: number | null = null;

  if (ptoEntries.length > 0) {
    const sorted = [...ptoEntries].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = new Date(sorted[0].date + 'T00:00:00');
    const today = new Date();

    daysSinceLastPto = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Next holiday
  const nextHoliday = ptoHolidays.find((h) => h.date >= todayKey);
  const nextHolidayDays = nextHoliday
    ? Math.ceil(
        (new Date(nextHoliday.date + 'T00:00:00').getTime() -
          new Date(todayKey + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const countdownTitle = nextHoliday
    ? nextHolidayDays === 0
      ? `Today is ${nextHoliday.name}!`
      : nextHolidayDays === 1
        ? `Tomorrow is ${nextHoliday.name}!`
        : `${nextHolidayDays} days until ${nextHoliday.name}!`
    : null;

  // PTO entry dates set for calendar
  const ptoDateSet = new Set(ptoEntries.map((e) => e.date));
  const holidayDateSet = new Set(ptoHolidays.map((h) => h.date));

  // Calendar
  const calYear = calMonth.getFullYear();
  const calMo = calMonth.getMonth();
  const firstDay = new Date(calYear, calMo, 1).getDay();
  const daysInMonth = new Date(calYear, calMo + 1, 0).getDate();
  const monthLabel = calMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const toggleDay = (dateStr: string) => {
    if (ptoDateSet.has(dateStr) || holidayDateSet.has(dateStr)) {
      return;
    }
    // Check it's a weekday
    const d = new Date(dateStr + 'T00:00:00');

    if (d.getDay() === 0 || d.getDay() === 6) {
      return;
    }
    setSelectedDays((prev) =>
      prev.includes(dateStr)
        ? prev.filter((x) => x !== dateStr)
        : [...prev, dateStr]
    );
  };

  // Email generation
  const generateEmail = () => {
    if (selectedDays.length === 0) {
      return '';
    }
    const sorted = [...selectedDays].sort();
    const dateList = sorted.map((d) => formatPtoDateLong(d)).join('\n');
    const dayWord = sorted.length === 1 ? 'day' : 'days';

    return `Hi ${ptoSettings.supervisorName},\n\nI'd like to request ${sorted.length} ${dayWord} of PTO:\n\n${dateList}\n\nPlease let me know if this works.\n\nThanks,\n${ptoSettings.initials}`;
  };

  const confirmPtoRequest = () => {
    const entries: PtoEntry[] = selectedDays.sort().map((date) => ({
      id: Date.now().toString() + date,
      date,
      type: 'vacation' as const,
      notes: '',
      confirmedAt: new Date().toISOString(),
    }));

    addPtoEntries(entries);
    setSelectedDays([]);
    showToast(`${entries.length} PTO day(s) logged!`, 'success');
  };

  const emailText = generateEmail();
  const emailSubject = selectedDays.length
    ? `PTO Request – ${ptoSettings.initials} – ${selectedDays
        .sort()
        .map((d) => formatPtoDate(d))
        .join(', ')}`
    : '';

  return (
    <div>
      {/* Stats Row */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-wb-border bg-wb-surface p-5 text-center">
          <div className="mb-1 font-mono text-[1.75rem] font-semibold text-wb-accent">
            {usedDays}
          </div>
          <div className="text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
            Days Used
          </div>
        </div>
        <div
          className={`rounded-xl border p-5 text-center ${remainingDays <= 3 ? 'border-amber-500 bg-amber-500/10' : 'border-wb-border bg-wb-surface'}`}
        >
          <div
            className={`mb-1 font-mono text-[1.75rem] font-semibold ${remainingDays <= 3 ? 'text-amber-500' : 'text-wb-accent'}`}
          >
            {remainingDays}
          </div>
          <div className="text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
            Days Left
          </div>
        </div>
        <div className="rounded-xl border border-wb-border bg-wb-surface p-5 text-center">
          <div className="mb-1 font-mono text-[1.75rem] font-semibold text-wb-accent">
            {usedPct}%
          </div>
          <div className="text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
            Used{ptoSettings.excludeRollover ? ' (excl. rollover)' : ''}
          </div>
        </div>
        <div
          className={`rounded-xl border p-5 text-center ${usingRollover ? 'border-amber-500 bg-amber-500/10' : 'border-wb-border bg-wb-surface'}`}
        >
          <div
            className={`mb-1 font-mono text-[1.75rem] font-semibold ${usingRollover ? 'text-amber-500' : 'text-wb-accent'}`}
          >
            {rolloverRemaining}
          </div>
          <div className="text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
            Rollover Left
          </div>
        </div>
      </div>

      {/* Holiday Countdown */}
      {nextHoliday && countdownTitle && (
        <div className="mb-7 flex flex-col items-center gap-2 rounded-xl border border-wb-accent bg-gradient-to-br from-wb-accent-dim to-transparent p-7 text-center">
          <div className="text-[1.75rem]">🎉</div>
          <div className="text-[1.15rem] font-semibold">{countdownTitle}</div>
          <div className="text-[0.8rem] text-wb-text-muted">
            {formatPtoDateLong(nextHoliday.date)}
          </div>
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-[1fr_280px] gap-8">
        {/* Left: Calendar + Request + History */}
        <div className="flex flex-col gap-7">
          {/* Request Section */}
          <div className="rounded-xl border border-wb-border bg-wb-surface p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">Request Time Off</h3>
              <button
                className="flex items-center rounded-lg border border-wb-border bg-transparent px-3 py-[6px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface-hover hover:text-wb-text"
                onClick={() => setShowSettingsModal(true)}
                type="button"
              >
                <svg
                  className="mr-1.5 inline-block align-[-2px]"
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Settings
              </button>
            </div>

            {/* Calendar */}
            <div className="mb-5">
              <div className="mb-4 flex items-center justify-center gap-5">
                <button
                  className="rounded-md border border-wb-border px-2.5 py-1.5 text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                  onClick={() => setCalMonth(new Date(calYear, calMo - 1))}
                  type="button"
                >
                  <svg
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="min-w-[150px] text-center font-medium">
                  {monthLabel}
                </span>
                <button
                  className="rounded-md border border-wb-border px-2.5 py-1.5 text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                  onClick={() => setCalMonth(new Date(calYear, calMo + 1))}
                  type="button"
                >
                  <svg
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div
                    className="py-1 text-center text-[0.65rem] font-medium text-wb-text-muted"
                    key={d}
                  >
                    {d}
                  </div>
                ))}
                {/* Blanks for first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {/* Days */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const d = new Date(calYear, calMo, day);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isHoliday = holidayDateSet.has(dateStr);
                  const isPto = ptoDateSet.has(dateStr);
                  const isSelected = selectedDays.includes(dateStr);
                  const isToday = dateStr === todayKey;

                  let cls =
                    'relative cursor-pointer rounded-md p-1.5 text-center text-[0.75rem] transition-all ';

                  if (isSelected) {
                    cls += 'bg-wb-accent text-wb-bg font-semibold';
                  } else if (isPto) {
                    cls += 'bg-blue-500/20 text-blue-400 font-medium';
                  } else if (isHoliday) {
                    cls += 'bg-wb-accent-dim text-wb-accent font-medium';
                  } else if (isWeekend) {
                    cls += 'text-wb-text-muted opacity-25 cursor-default';
                  } else if (isToday) {
                    cls +=
                      'text-wb-accent font-semibold hover:bg-wb-surface-hover';
                  } else {
                    cls +=
                      'text-wb-text-muted hover:bg-wb-surface-hover hover:text-wb-text';
                  }

                  return (
                    <div
                      className={cls}
                      key={dateStr}
                      onClick={() => toggleDay(dateStr)}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected days summary */}
            {selectedDays.length > 0 && (
              <div className="mb-4 rounded-lg border border-wb-accent bg-wb-accent-dim p-3">
                <div className="mb-2 text-[0.8rem] font-medium text-wb-accent">
                  {selectedDays.length} day
                  {selectedDays.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[...selectedDays].sort().map((d) => (
                    <span
                      className="rounded-full bg-wb-accent/20 px-2.5 py-0.5 text-[0.75rem] text-wb-accent"
                      key={d}
                    >
                      {formatPtoDate(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Email preview */}
            {selectedDays.length > 0 && (
              <div className="space-y-3">
                <InputField label="Email Preview">
                  <textarea
                    className="w-full resize-y rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 font-mono text-[0.85rem] leading-relaxed text-wb-text outline-none"
                    readOnly
                    rows={6}
                    value={emailText}
                  />
                </InputField>
                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-lg border border-wb-border bg-transparent px-4 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
                    onClick={() => {
                      navigator.clipboard.writeText(emailText);
                      showToast('Email copied!', 'success');
                    }}
                    type="button"
                  >
                    Copy Email
                  </button>
                  <a
                    className="flex flex-1 items-center justify-center rounded-lg bg-wb-accent px-4 py-2.5 text-[0.875rem] font-medium text-wb-bg transition-all hover:brightness-110"
                    href={`mailto:${ptoSettings.supervisorEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailText)}`}
                  >
                    Open in Mail
                  </a>
                </div>
                <div className="border-t border-dashed border-wb-border pt-5">
                  <p className="mb-3 text-[0.85rem] text-wb-text-muted">
                    After sending and receiving approval, confirm to log these
                    days:
                  </p>
                  <button
                    className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg transition-all hover:brightness-110"
                    onClick={confirmPtoRequest}
                    type="button"
                  >
                    Confirm PTO Sent & Approved
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PTO History */}
          <div className="rounded-xl border border-wb-border bg-wb-surface p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">
                <svg
                  className="mr-2 inline-block align-[-2px]"
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                2026 PTO History
              </h3>
              <button
                className="flex items-center rounded-lg border border-wb-border bg-transparent px-3 py-[6px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface-hover hover:text-wb-text"
                onClick={() => setShowManualEntryModal(true)}
                type="button"
              >
                <svg
                  className="mr-1.5 inline-block align-[-2px]"
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="16" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                </svg>
                Add Past Entry
              </button>
            </div>
            {ptoEntries.length === 0 ? (
              <div className="py-8 text-center text-wb-text-muted">
                No PTO entries yet
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {[...ptoEntries]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((entry) => (
                    <div
                      className="group flex items-center justify-between rounded-lg bg-wb-bg px-4 py-3"
                      key={entry.id}
                    >
                      <div className="font-medium">
                        {formatPtoDate(entry.date)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded bg-wb-surface px-2 py-1 text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
                          {entry.type}
                        </div>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-wb-border text-wb-text-muted opacity-0 transition-all hover:border-wb-danger hover:text-wb-danger group-hover:opacity-100"
                          onClick={() => setConfirmDeleteId(entry.id)}
                          type="button"
                        >
                          <svg
                            fill="none"
                            height="12"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="12"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Holidays Sidebar */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-wb-border bg-wb-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[0.9rem] font-semibold">2026 Holidays</h4>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md border border-wb-border text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                onClick={() => {
                  setEditHolidayIdx(null);
                  setShowAddHolidayModal(true);
                }}
                type="button"
              >
                <svg
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  width="12"
                >
                  <line x1="12" x2="12" y1="5" y2="19" />
                  <line x1="5" x2="19" y1="12" y2="12" />
                </svg>
              </button>
            </div>
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
              {ptoHolidays.length === 0 ? (
                <div className="py-4 text-center text-[0.85rem] text-wb-text-muted">
                  No holidays configured
                </div>
              ) : (
                ptoHolidays.map((h, idx) => {
                  const isPast = h.date < todayKey;
                  const isNext = nextHoliday && h.date === nextHoliday.date;

                  return (
                    <div
                      className={`group relative flex items-center gap-3 rounded-lg p-3 text-[0.85rem] ${
                        isNext
                          ? 'border border-wb-accent bg-wb-accent-dim'
                          : isPast
                            ? 'bg-wb-bg opacity-40 hover:opacity-100'
                            : 'bg-wb-bg'
                      }`}
                      key={`${h.date}-${idx}`}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                        <div className="truncate font-medium">{h.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.7rem] text-wb-text-muted">
                            {formatPtoDate(h.date)}
                          </span>
                          {h.note && (
                            <span className="text-[0.65rem] uppercase text-wb-text-muted opacity-60">
                              {h.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded border border-wb-border text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                          onClick={() => {
                            setEditHolidayIdx(idx);
                            setShowAddHolidayModal(true);
                          }}
                          type="button"
                        >
                          <svg
                            fill="none"
                            height="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="10"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded border border-wb-border text-wb-text-muted transition-all hover:border-wb-danger hover:text-wb-danger"
                          onClick={() => setConfirmDeleteHolidayIdx(idx)}
                          type="button"
                        >
                          <svg
                            fill="none"
                            height="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="10"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {daysSinceLastPto !== null && daysSinceLastPto > 60 && (
              <div className="mt-4 rounded-lg border border-dashed border-amber-400 bg-amber-400/10 p-3 text-center text-[0.85rem] text-amber-400">
                ⏰ It&apos;s been {daysSinceLastPto} days since your last PTO.
                Maybe time for a break?
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* PTO Settings Modal */}
      <PtoSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={(settings) => {
          updatePtoSettings(settings);
          setShowSettingsModal(false);
          showToast('PTO settings saved', 'success');
        }}
        settings={ptoSettings}
      />

      {/* Add/Edit Holiday Modal */}
      <AddHolidayModal
        editIdx={editHolidayIdx}
        holidays={ptoHolidays}
        isOpen={showAddHolidayModal}
        onClose={() => {
          setShowAddHolidayModal(false);
          setEditHolidayIdx(null);
        }}
        onSave={(holidays) => {
          updatePtoHolidays(holidays);
          setShowAddHolidayModal(false);
          setEditHolidayIdx(null);
        }}
        showToast={showToast}
      />

      {/* Manual PTO Entry Modal */}
      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        onSave={(entry) => {
          addPtoEntry(entry);
          setShowManualEntryModal(false);
          showToast('PTO entry added', 'success');
        }}
      />

      {/* Delete PTO Entry Confirm */}
      <ConfirmDialog
        danger
        isOpen={!!confirmDeleteId}
        message="Remove this PTO entry?"
        okText="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deletePtoEntry(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
        title="Delete PTO Entry"
      />

      {/* Delete Holiday Confirm */}
      <ConfirmDialog
        danger
        isOpen={confirmDeleteHolidayIdx !== null}
        message={
          confirmDeleteHolidayIdx !== null &&
          ptoHolidays[confirmDeleteHolidayIdx]
            ? `Remove "${ptoHolidays[confirmDeleteHolidayIdx].name}" from your holidays?`
            : ''
        }
        okText="Delete"
        onCancel={() => setConfirmDeleteHolidayIdx(null)}
        onConfirm={() => {
          if (confirmDeleteHolidayIdx !== null) {
            const next = ptoHolidays.filter(
              (_, i) => i !== confirmDeleteHolidayIdx
            );

            updatePtoHolidays(next);
          }
          setConfirmDeleteHolidayIdx(null);
        }}
        title="Delete Holiday"
      />
    </div>
  );
}

// ── Sub-Modals ──

function PtoSettingsModal({
  isOpen,
  onClose,
  onSave,
  settings,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (s: typeof settings) => void;
  settings: NonNullable<ReturnType<typeof useApp>['ptoSettings']>;
}) {
  const [startYear, setStartYear] = useState(settings.startYear);
  const [rollover, setRollover] = useState(settings.rolloverDays);
  const [initials, setInitials] = useState(settings.initials);
  const [supervisor, setSupervisor] = useState(settings.supervisorName);
  const [email, setEmail] = useState(settings.supervisorEmail);
  const [excludeRollover, setExcludeRollover] = useState(
    settings.excludeRollover
  );
  const years = Array.from({ length: 30 }, (_, i) => 2026 - i);

  // Reset when opened
  const resetForm = useCallback(() => {
    setStartYear(settings.startYear);
    setRollover(settings.rolloverDays);
    setInitials(settings.initials);
    setSupervisor(settings.supervisorName);
    setEmail(settings.supervisorEmail);
    setExcludeRollover(settings.excludeRollover);
  }, [settings]);

  return (
    <Modal
      className="w-full max-w-[480px]"
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
    >
      <h3 className="mb-6 font-medium">PTO Settings</h3>
      <div className="space-y-4">
        <InputField label="Year Employment Started">
          <select
            className="w-full cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setStartYear(Number(e.target.value))}
            value={startYear}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </InputField>
        <InputField label="Rollover Days">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            max={8}
            min={0}
            onChange={(e) => setRollover(Number(e.target.value))}
            type="number"
            value={rollover}
          />
        </InputField>
        <InputField label="Your Initials">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            maxLength={5}
            onChange={(e) => setInitials(e.target.value)}
            type="text"
            value={initials}
          />
        </InputField>
        <InputField label="Supervisor Name">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setSupervisor(e.target.value)}
            type="text"
            value={supervisor}
          />
        </InputField>
        <InputField label="Supervisor Email">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            value={email}
          />
        </InputField>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            checked={excludeRollover}
            className="accent-wb-accent"
            onChange={(e) => setExcludeRollover(e.target.checked)}
            type="checkbox"
          />
          <span className="text-[0.85rem] text-wb-text-muted">
            Exclude rollover days from percentage
          </span>
        </label>
      </div>
      <div className="-mx-8 -mb-8 mt-6 flex justify-end gap-3 border-t border-wb-border px-8 py-4">
        <button
          className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted"
          onClick={() => {
            resetForm();
            onClose();
          }}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg"
          onClick={() =>
            onSave({
              startYear,
              rolloverDays: rollover,
              initials,
              supervisorName: supervisor,
              supervisorEmail: email,
              excludeRollover,
            })
          }
          type="button"
        >
          Save Settings
        </button>
      </div>
    </Modal>
  );
}

function AddHolidayModal({
  editIdx,
  holidays,
  isOpen,
  onClose,
  onSave,
  showToast,
}: {
  editIdx: number | null;
  holidays: Holiday[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (holidays: Holiday[]) => void;
  showToast: (msg: string, type: 'error' | 'success') => void;
}) {
  const editing = editIdx !== null ? holidays[editIdx] : null;
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  // Reset form when opened
  useMemo(() => {
    if (isOpen) {
      setDate(editing?.date || '');
      setName(editing?.name || '');
      setNote(editing?.note || '');
    }
  }, [isOpen, editing]);

  const handleSave = () => {
    if (!date || !name.trim()) {
      showToast('Date and name are required', 'error');

      return;
    }
    const next = [...holidays];

    if (editIdx !== null) {
      next[editIdx] = {
        date,
        name: name.trim(),
        note: note.trim().toUpperCase(),
      };
    } else {
      if (holidays.find((h) => h.date === date)) {
        showToast('A holiday already exists on this date', 'error');

        return;
      }
      next.push({ date, name: name.trim(), note: note.trim().toUpperCase() });
    }
    next.sort((a, b) => a.date.localeCompare(b.date));
    onSave(next);
  };

  return (
    <Modal className="w-full max-w-[480px]" isOpen={isOpen} onClose={onClose}>
      <h3 className="mb-6 font-medium">
        {editing ? 'Edit Holiday' : 'Add Holiday'}
      </h3>
      <div className="space-y-4">
        <InputField label="Date">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </InputField>
        <InputField label="Name">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Memorial Day"
            type="text"
            value={name}
          />
        </InputField>
        <InputField label="Note (optional)">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., CLOSED"
            type="text"
            value={note}
          />
        </InputField>
      </div>
      <div className="-mx-8 -mb-8 mt-6 flex justify-end gap-3 border-t border-wb-border px-8 py-4">
        <button
          className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg"
          onClick={handleSave}
          type="button"
        >
          {editing ? 'Save Changes' : 'Add Holiday'}
        </button>
      </div>
    </Modal>
  );
}

function ManualEntryModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: PtoEntry) => void;
}) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<'vacation' | 'sick'>('vacation');
  const [notes, setNotes] = useState('');

  return (
    <Modal className="w-full max-w-[480px]" isOpen={isOpen} onClose={onClose}>
      <h3 className="mb-6 font-medium">Add Past PTO Entry</h3>
      <div className="space-y-4">
        <InputField label="Date">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </InputField>
        <InputField label="Type">
          <select
            className="w-full cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setType(e.target.value as 'vacation' | 'sick')}
            value={type}
          >
            <option value="vacation">Vacation</option>
            <option value="sick">Sick</option>
          </select>
        </InputField>
        <InputField label="Notes (optional)">
          <input
            className="w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Doctor appointment"
            type="text"
            value={notes}
          />
        </InputField>
      </div>
      <div className="-mx-8 -mb-8 mt-6 flex justify-end gap-3 border-t border-wb-border px-8 py-4">
        <button
          className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg"
          onClick={() => {
            if (!date) {
              return;
            }
            onSave({
              id: Date.now().toString(),
              date,
              type,
              notes: notes.trim(),
              confirmedAt: new Date().toISOString(),
              manual: true,
            });
            setDate('');
            setNotes('');
          }}
          type="button"
        >
          Add Entry
        </button>
      </div>
    </Modal>
  );
}

// ── Shared tiny component ──

function InputField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-left text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
