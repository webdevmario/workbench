import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmDialog, Modal } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';
import {
  formatDateLabel,
  formatTime,
  formatTimeShort,
  getDateKey,
} from '@/services/dates';
import type { TimeEntry } from '@/types';

export function TimerView() {
  const {
    categories,
    timeEntries,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    runningTimer,
    startTimer,
    stopTimer,
    timerViewDate,
    setTimerViewDate,
    updateCategories,
    showToast,
  } = useApp();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpMonth, setDpMonth] = useState(new Date(timerViewDate));
  const descRef = useRef<HTMLInputElement>(null);

  // Timer display update
  useEffect(() => {
    if (!runningTimer) {
      setElapsed('00:00:00');

      return;
    }

    const update = () => {
      const ms = Date.now() - new Date(runningTimer.startTime).getTime();

      setElapsed(formatTime(ms));
    };

    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);

  // Restore description from running timer
  useEffect(() => {
    if (runningTimer) {
      setDescription(runningTimer.description);
      setCategory(runningTimer.category);
    }
  }, [runningTimer]);

  const dateKey = getDateKey(timerViewDate);
  const isToday = dateKey === getDateKey(new Date());

  const dayEntries = useMemo(
    () =>
      timeEntries
        .filter((e) => getDateKey(new Date(e.startTime)) === dateKey)
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ),
    [timeEntries, dateKey]
  );

  const { totalMs, catTotals } = useMemo(() => {
    let total = 0;
    const cats: Record<string, number> = {};

    dayEntries.forEach((e) => {
      const d =
        new Date(e.endTime).getTime() - new Date(e.startTime).getTime();

      total += d;
      cats[e.category] = (cats[e.category] || 0) + d;
    });

    return { totalMs: total, catTotals: cats };
  }, [dayEntries]);

  // Dates with content for date picker dots
  const contentDates = useMemo(() => {
    const dates = new Set<string>();

    timeEntries.forEach((e) =>
      dates.add(getDateKey(new Date(e.startTime)))
    );

    return dates;
  }, [timeEntries]);

  const handleStart = useCallback(() => {
    if (!description.trim()) {
      descRef.current?.focus();

      return;
    }
    startTimer(description.trim(), category);
  }, [description, category, startTimer]);

  const handleStop = useCallback(() => {
    stopTimer();
    setDescription('');
  }, [stopTimer]);

  const changeDate = useCallback(
    (delta: number) => {
      const d = new Date(timerViewDate);

      d.setDate(d.getDate() + delta);
      setTimerViewDate(d);
    },
    [timerViewDate, setTimerViewDate]
  );

  const handleResume = useCallback(
    (entry: TimeEntry) => {
      if (runningTimer) {
        showToast('A timer is already running. Stop it first.', 'error');

        return;
      }
      setDescription(entry.description);
      setCategory(entry.category);
      startTimer(entry.description, entry.category);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [runningTimer, startTimer, showToast]
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b)),
    [categories]
  );

  // Date picker
  const openDatePicker = () => {
    setDpMonth(new Date(timerViewDate));
    setShowDatePicker(true);
  };

  const dpYear = dpMonth.getFullYear();
  const dpMo = dpMonth.getMonth();
  const dpFirstDay = new Date(dpYear, dpMo, 1).getDay();
  const dpDaysInMonth = new Date(dpYear, dpMo + 1, 0).getDate();
  const dpMonthLabel = dpMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const selectedDateKey = getDateKey(timerViewDate);
  const todayKey = getDateKey(new Date());

  return (
    <div>
      {/* Timer Section */}
      <section className="mb-12 rounded-2xl border border-wb-border bg-wb-surface p-8">
        <div
          className={`mb-8 text-center font-mono text-[4rem] font-medium tracking-tight transition-opacity ${
            runningTimer
              ? 'animate-pulse text-wb-accent opacity-100'
              : 'text-wb-accent opacity-30'
          }`}
        >
          {elapsed}
        </div>

        <div className="mb-6 grid grid-cols-[1fr_260px] gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
              Description
            </label>
            <input
              className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none transition-colors focus:border-wb-accent"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
              placeholder="What are you working on?"
              ref={descRef}
              type="text"
              value={description}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
              Category
            </label>
            <select
              className="cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none transition-colors focus:border-wb-accent"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategory(e.target.value)
              }
              value={category}
            >
              {sortedCategories.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!runningTimer ? (
            <button
              className="rounded-xl bg-wb-accent px-12 py-4 text-base font-semibold tracking-wide text-wb-bg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-wb-accent/30"
              onClick={handleStart}
              type="button"
            >
              <svg
                className="mr-2 inline-block align-[-3px]"
                fill="currentColor"
                height="18"
                stroke="none"
                viewBox="0 0 24 24"
                width="18"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Timer
            </button>
          ) : (
            <button
              className="rounded-xl bg-wb-danger px-12 py-4 text-base font-semibold text-white transition-all hover:brightness-110"
              onClick={handleStop}
              type="button"
            >
              <svg
                className="mr-2 inline-block align-[-3px]"
                fill="currentColor"
                height="18"
                stroke="none"
                viewBox="0 0 24 24"
                width="18"
              >
                <rect height="16" rx="2" width="16" x="4" y="4" />
              </svg>
              Stop &amp; Save
            </button>
          )}
        </div>
      </section>

      {/* Daily View */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
              onClick={() => changeDate(-1)}
              type="button"
            >
              <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            {/* Clickable date with popover calendar */}
            <div className="relative">
              <span
                className="cursor-pointer rounded-md px-2 py-1 font-medium transition-all hover:bg-wb-surface-hover hover:text-wb-accent"
                onClick={openDatePicker}
              >
                {formatDateLabel(timerViewDate)}
              </span>

              {showDatePicker && (
                <>
                  <div
                    className="fixed inset-0 z-[89]"
                    onClick={() => setShowDatePicker(false)}
                  />
                  <div className="absolute left-1/2 top-[calc(100%+8px)] z-[90] w-[280px] -translate-x-1/2 rounded-xl border border-wb-border bg-wb-surface p-4 shadow-xl shadow-black/50">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-wb-border text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                        onClick={() => setDpMonth(new Date(dpYear, dpMo - 1))}
                        type="button"
                      >
                        <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><polyline points="15 18 9 12 15 6" /></svg>
                      </button>
                      <span className="text-[0.85rem] font-medium">{dpMonthLabel}</span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-wb-border text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                        onClick={() => setDpMonth(new Date(dpYear, dpMo + 1))}
                        type="button"
                      >
                        <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><polyline points="9 18 15 12 9 6" /></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(
                        (d) => (
                          <div
                            className="py-1 text-center text-[0.65rem] font-medium text-wb-text-muted"
                            key={d}
                          >
                            {d}
                          </div>
                        )
                      )}
                      {Array.from({ length: dpFirstDay }).map((_, i) => (
                        <div className="text-center text-[0.75rem] text-wb-text-muted opacity-25" key={`b-${i}`} />
                      ))}
                      {Array.from({ length: dpDaysInMonth }, (_, i) => {
                        const day = i + 1;
                        const ds = `${dpYear}-${String(dpMo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = ds === selectedDateKey;
                        const isTodayDay = ds === todayKey;
                        const hasContent = contentDates.has(ds);

                        let cls =
                          'relative cursor-pointer rounded-md py-1.5 text-center text-[0.75rem] transition-all ';

                        if (isSelected) {
                          cls += 'bg-wb-accent text-wb-bg font-semibold';
                        } else if (isTodayDay) {
                          cls +=
                            'text-wb-accent font-semibold hover:bg-wb-surface-hover';
                        } else {
                          cls +=
                            'text-wb-text-muted hover:bg-wb-surface-hover hover:text-wb-text';
                        }

                        return (
                          <div
                            className={cls}
                            key={ds}
                            onClick={() => {
                              const parts = ds.split('-');
                              const nd = new Date(
                                +parts[0],
                                +parts[1] - 1,
                                +parts[2]
                              );

                              setTimerViewDate(nd);
                              setShowDatePicker(false);
                            }}
                          >
                            {day}
                            {hasContent && (
                              <span
                                className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSelected ? 'bg-wb-bg' : 'bg-wb-accent'}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
              onClick={() => changeDate(1)}
              type="button"
            >
              <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="9 18 15 12 9 6" /></svg>
            </button>

            {!isToday && (
              <button
                className="ml-1 whitespace-nowrap rounded-lg border border-wb-accent px-3 py-1.5 text-[0.75rem] font-medium text-wb-accent transition-all hover:bg-wb-accent-dim"
                onClick={() => setTimerViewDate(new Date())}
                type="button"
              >
                <svg className="mr-1 inline-block align-[-1px]" fill="none" height="12" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="12"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                Today
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center rounded-lg border border-wb-border bg-transparent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
              onClick={() => setShowAddModal(true)}
              type="button"
            >
              <svg className="mr-1.5 inline-block align-[-2px]" fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="16" /><line x1="8" x2="16" y1="12" y2="12" /></svg>
              Add Entry
            </button>
            <button
              className="flex items-center rounded-lg border border-wb-border bg-transparent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
              onClick={() => setShowCategoryModal(true)}
              type="button"
            >
              <svg className="mr-1.5 inline-block align-[-2px]" fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><path d="M4 7h16M4 12h10M4 17h13" /></svg>
              Categories
            </button>
            <div className="rounded-full bg-wb-accent-dim px-4 py-2 font-mono text-[0.875rem] text-wb-accent">
              Total: {formatTime(totalMs)}
            </div>
          </div>
        </div>

        {/* Category Summary */}
        {Object.keys(catTotals).length > 0 && (
          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {Object.entries(catTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, ms]) => (
                <div
                  className="rounded-[10px] border border-wb-border bg-wb-surface p-4"
                  key={cat}
                >
                  <div className="text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
                    {cat}
                  </div>
                  <div className="mt-1.5 font-mono text-[1.25rem] font-medium text-wb-accent">
                    {formatTime(ms)}
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-sm bg-wb-border">
                    <div
                      className="h-full rounded-sm bg-wb-accent transition-all"
                      style={{ width: `${(ms / totalMs) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Entries List */}
        <div className="flex flex-col gap-2">
          {dayEntries.length === 0 ? (
            <div className="py-16 text-center text-wb-text-muted">
              <svg className="mx-auto mb-4 opacity-30" fill="none" height="48" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="48"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <p>No entries for this day</p>
            </div>
          ) : (
            dayEntries.map((entry: TimeEntry) => {
              const start = new Date(entry.startTime);
              const end = new Date(entry.endTime);
              const duration = end.getTime() - start.getTime();

              return (
                <div
                  className="group grid grid-cols-[165px_1fr_80px_auto] items-center gap-5 rounded-xl border border-wb-border bg-wb-surface px-6 py-5 transition-all hover:border-wb-accent hover:bg-wb-surface-hover"
                  key={entry.id}
                >
                  <div className="whitespace-nowrap font-mono text-[0.8rem] text-wb-text-muted">
                    {formatTimeShort(start)} – {formatTimeShort(end)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{entry.description}</div>
                    <div className="text-[0.75rem] uppercase tracking-wider text-wb-accent">
                      {entry.category}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[0.875rem]">
                    {formatTime(duration)}
                  </div>
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-accent hover:bg-wb-accent-dim hover:text-wb-accent" onClick={() => handleResume(entry)} title="Continue" type="button">
                      <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent" onClick={() => { setEditingEntry(entry); setShowEditModal(true); }} title="Edit" type="button">
                      <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-danger hover:text-wb-danger" onClick={() => setConfirmDelete(entry.id)} title="Delete" type="button">
                      <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Edit Entry Modal */}
      <EditEntryModal categories={sortedCategories} entry={editingEntry} isOpen={showEditModal} onClose={() => setShowEditModal(false)} onSave={(id, updates) => { updateTimeEntry(id, updates); setShowEditModal(false); }} />
      <AddEntryModal categories={sortedCategories} defaultDate={dateKey} isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={(entry) => { addTimeEntry(entry); setShowAddModal(false); setTimerViewDate(new Date(entry.startTime)); }} showToast={showToast} />
      <CategoryModal categories={categories} isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSave={(cats, renames) => { updateCategories(cats, renames); setShowCategoryModal(false); showToast('Categories saved', 'success'); }} />
      <ConfirmDialog danger isOpen={!!confirmDelete} message="Delete this time entry?" okText="Delete" onCancel={() => setConfirmDelete(null)} onConfirm={() => { if (confirmDelete) { deleteTimeEntry(confirmDelete); } setConfirmDelete(null); }} title="Delete Entry" />
    </div>
  );
}

// ── Sub-components ──

function EditEntryModal({ categories, entry, isOpen, onClose, onSave }: { categories: string[]; entry: TimeEntry | null; isOpen: boolean; onClose: () => void; onSave: (id: string, updates: Partial<TimeEntry>) => void }) {
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (entry) {
      const s = new Date(entry.startTime);
      const e = new Date(entry.endTime);

      setDesc(entry.description);
      setCat(entry.category);
      setDate(getDateKey(s));
      setStartTime(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}:${String(s.getSeconds()).padStart(2, '0')}`);
      setEndTime(`${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}:${String(e.getSeconds()).padStart(2, '0')}`);
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) { return; }
    const [year, month, day] = date.split('-').map(Number);
    const sp = startTime.split(':').map(Number);
    const ep = endTime.split(':').map(Number);
    const sd = new Date(year, month - 1, day, sp[0], sp[1], sp[2] || 0);
    const ed = new Date(year, month - 1, day, ep[0], ep[1], ep[2] || 0);

    onSave(entry.id, { description: desc, category: cat, startTime: sd.toISOString(), endTime: ed.toISOString() });
  };

  return (
    <Modal className="w-full max-w-[480px]" isOpen={isOpen} onClose={onClose}>
      <h3 className="mb-6 font-medium">Edit Entry</h3>
      <div className="mb-4 flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Description</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)} type="text" value={desc} /></div>
      <div className="mb-4 flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Category</label><select className="cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCat(e.target.value)} value={cat}>{categories.map((c: string) => (<option key={c} value={c}>{c}</option>))}</select></div>
      <div className="mb-4 flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Date</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} type="date" value={date} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Start Time</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)} step="1" type="time" value={startTime} /></div>
        <div className="flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">End Time</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)} step="1" type="time" value={endTime} /></div>
      </div>
      <div className="-mx-8 -mb-8 mt-6 flex justify-end gap-3 border-t border-wb-border px-8 py-4">
        <button className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text" onClick={onClose} type="button">Cancel</button>
        <button className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg transition-all hover:brightness-110" onClick={handleSave} type="button">Save Changes</button>
      </div>
    </Modal>
  );
}

function AddEntryModal({ categories, defaultDate, isOpen, onClose, onSave, showToast }: { categories: string[]; defaultDate: string; isOpen: boolean; onClose: () => void; onSave: (entry: TimeEntry) => void; showToast: (msg: string, type: 'error') => void }) {
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState(categories[0] || '');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => { if (isOpen) { setDesc(''); setDate(defaultDate); setStartTime('09:00'); setEndTime('10:00'); setCat(categories[0] || ''); } }, [isOpen, defaultDate, categories]);

  const handleSave = () => {
    if (!desc.trim()) { showToast('Please enter a description', 'error'); return; }
    if (!date || !startTime || !endTime) { showToast('Please fill in date and times', 'error'); return; }
    const [year, month, day] = date.split('-').map(Number);
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const sd = new Date(year, month - 1, day, sh, sm, 0);
    const ed = new Date(year, month - 1, day, eh, em, 0);

    if (ed <= sd) { showToast('End time must be after start time', 'error'); return; }
    onSave({ id: Date.now().toString(), description: desc.trim(), category: cat, startTime: sd.toISOString(), endTime: ed.toISOString() });
  };

  return (
    <Modal className="w-full max-w-[480px]" isOpen={isOpen} onClose={onClose}>
      <h3 className="mb-6 font-medium">Add Time Entry</h3>
      <div className="mb-4 flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Description</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)} placeholder="What did you work on?" type="text" value={desc} /></div>
      <div className="mb-4 flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Category</label><select className="cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCat(e.target.value)} value={cat}>{categories.map((c: string) => (<option key={c} value={c}>{c}</option>))}</select></div>
      <div className="mb-4 flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Date</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} type="date" value={date} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">Start Time</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)} type="time" value={startTime} /></div>
        <div className="flex flex-col gap-2"><label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">End Time</label><input className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)} type="time" value={endTime} /></div>
      </div>
      <div className="-mx-8 -mb-8 mt-6 flex justify-end gap-3 border-t border-wb-border px-8 py-4">
        <button className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text" onClick={onClose} type="button">Cancel</button>
        <button className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg transition-all hover:brightness-110" onClick={handleSave} type="button">Add Entry</button>
      </div>
    </Modal>
  );
}

function CategoryModal({ categories, isOpen, onClose, onSave }: { categories: string[]; isOpen: boolean; onClose: () => void; onSave: (cats: string[], renames: Record<string, string>) => void }) {
  const [rows, setRows] = useState<{ original: string; value: string }[]>([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => { if (isOpen) { setRows([...categories].sort((a, b) => a.localeCompare(b)).map((c) => ({ original: c, value: c }))); setNewCat(''); } }, [isOpen, categories]);

  const addCategory = () => { if (!newCat.trim()) { return; } setRows((prev) => [...prev, { original: '', value: newCat.trim() }]); setNewCat(''); };

  const handleSave = () => {
    const renames: Record<string, string> = {};
    const cats: string[] = [];

    rows.forEach((row) => { const name = row.value.trim(); if (!name) { return; } cats.push(name); if (row.original && row.original !== name) { renames[row.original] = name; } });
    onSave(cats, renames);
  };

  return (
    <Modal className="flex h-[640px] w-full max-w-[480px] flex-col" isOpen={isOpen} onClose={onClose}>
      <h3 className="mb-6 flex-shrink-0 font-medium">Manage Categories</h3>
      <div className="mb-6 flex flex-shrink-0 gap-2 border-b border-wb-border pb-5">
        <input className="flex-1 rounded-md border border-wb-border bg-wb-bg px-3 py-2 text-[0.875rem] text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCat(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} placeholder="Add a new category..." type="text" value={newCat} />
        <button className="rounded-lg bg-wb-accent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-bg" onClick={addCategory} type="button">Add</button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="py-4 text-center text-[0.85rem] text-wb-text-muted">No categories yet</div>
        ) : (
          rows.map((row, i) => (
            <div className="flex items-center gap-2.5" key={i}>
              <input className="flex-1 rounded-md border border-wb-border bg-wb-bg px-3 py-2 text-[0.875rem] text-wb-text outline-none focus:border-wb-accent" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setRows((prev) => prev.map((r, j) => j === i ? { ...r, value: e.target.value } : r)); }} type="text" value={row.value} />
              <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-danger hover:text-wb-danger" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))} type="button">
                <svg fill="none" height="13" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          ))
        )}
      </div>
      <div className="-mx-8 -mb-8 mt-auto flex flex-shrink-0 justify-end gap-3 border-t border-wb-border px-8 py-4">
        <button className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text" onClick={onClose} type="button">Cancel</button>
        <button className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg transition-all hover:brightness-110" onClick={handleSave} type="button">Save</button>
      </div>
    </Modal>
  );
}
