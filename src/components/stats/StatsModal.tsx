import { useMemo, useState } from 'react';

import { Modal } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';
import { getDateKey } from '@/services/dates';
import type { StatsPeriod } from '@/types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { timeEntries, tasks } = useApp();
  const [period, setPeriod] = useState<StatsPeriod>('week');

  const stats = useMemo(() => {
    if (!timeEntries.length) {
      return null;
    }

    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(0);
    }

    const filtered = timeEntries.filter(
      (e) => new Date(e.startTime) >= startDate
    );

    if (!filtered.length) {
      return null;
    }

    let totalMs = 0;
    const catTotals: Record<string, number> = {};
    const daySet = new Set<string>();

    filtered.forEach((e) => {
      const duration =
        new Date(e.endTime).getTime() - new Date(e.startTime).getTime();

      totalMs += duration;
      catTotals[e.category] = (catTotals[e.category] || 0) + duration;
      daySet.add(getDateKey(new Date(e.startTime)));
    });

    const totalHours = totalMs / (1000 * 60 * 60);
    const todayKey = getDateKey(new Date());
    const completedDays = [...daySet].filter((d) => d !== todayKey);

    let completedDaysMs = 0;

    filtered.forEach((e) => {
      const dk = getDateKey(new Date(e.startTime));

      if (dk !== todayKey) {
        completedDaysMs +=
          new Date(e.endTime).getTime() - new Date(e.startTime).getTime();
      }
    });

    const avgPerDay =
      completedDays.length > 0
        ? completedDaysMs / completedDays.length / (1000 * 60 * 60)
        : totalHours;

    const completedTasks = tasks.filter((t) => {
      const taskDate = new Date(t.date);

      return taskDate >= startDate && t.done;
    }).length;

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    return {
      totalHours,
      avgPerDay,
      completedTasks,
      sortedCats,
      totalMs,
    };
  }, [timeEntries, tasks, period]);

  return (
    <Modal
      className="max-h-[85vh] w-full max-w-[600px] overflow-y-auto"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="mb-6 flex flex-col items-center gap-4">
        <h3 className="font-medium">Stats</h3>
        <div className="flex gap-1 rounded-md bg-wb-bg p-0.5">
          {(['week', 'month', 'all'] as StatsPeriod[]).map((p) => (
            <button
              className={`w-[70px] rounded px-0 py-1.5 text-center text-[0.75rem] transition-all ${
                period === p
                  ? 'bg-wb-surface text-wb-text'
                  : 'bg-transparent text-wb-text-muted hover:text-wb-text'
              }`}
              key={p}
              onClick={() => setPeriod(p)}
              type="button"
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {!stats ? (
        <div className="py-10 text-center text-wb-text-muted">
          {!timeEntries.length
            ? 'No time entries yet. Start tracking to see your stats!'
            : 'No entries in this period.'}
        </div>
      ) : (
        <>
          <div className="mb-7 grid grid-cols-3 gap-3">
            <div className="rounded-[10px] bg-wb-bg p-4 text-center">
              <div className="mb-1 font-mono text-2xl font-semibold text-wb-accent">
                {stats.totalHours.toFixed(1)}h
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-wb-text-muted">
                Total Time
              </div>
            </div>
            <div className="rounded-[10px] bg-wb-bg p-4 text-center">
              <div className="mb-1 font-mono text-2xl font-semibold text-wb-accent">
                {stats.avgPerDay.toFixed(1)}h
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-wb-text-muted">
                Avg / Day
              </div>
            </div>
            <div className="rounded-[10px] bg-wb-bg p-4 text-center">
              <div className="mb-1 font-mono text-2xl font-semibold text-wb-accent">
                {stats.completedTasks}
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-wb-text-muted">
                Tasks Done
              </div>
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-3.5 text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
              Time by Category
            </div>
            <div className="flex flex-col gap-2.5">
              {stats.sortedCats.map(([cat, ms]) => (
                <div className="flex items-center gap-3" key={cat}>
                  <div className="w-[140px] truncate text-[0.85rem]">
                    {cat}
                  </div>
                  <div className="flex-1 overflow-hidden rounded bg-wb-bg">
                    <div
                      className="h-2 rounded bg-wb-accent transition-all"
                      style={{
                        width: `${(ms / stats.sortedCats[0][1]) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-[60px] text-right font-mono text-[0.8rem] text-wb-text-muted">
                    {(ms / (1000 * 60 * 60)).toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
              Category Breakdown
            </div>
            <div className="flex flex-col gap-2">
              {stats.sortedCats.map(([cat, ms]) => {
                const pct = ((ms / stats.totalMs) * 100).toFixed(1);

                return (
                  <div
                    className="relative flex items-center justify-between overflow-hidden rounded-lg bg-wb-bg px-3.5 py-2.5"
                    key={cat}
                  >
                    <div
                      className="absolute bottom-0 left-0 top-0 rounded-lg bg-wb-accent-dim"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative z-10 text-[0.85rem]">{cat}</div>
                    <div className="relative z-10 font-mono text-[0.85rem] font-medium text-wb-accent">
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="-mx-8 -mb-8 mt-6 flex justify-end border-t border-wb-border px-8 py-4">
        <button
          className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
