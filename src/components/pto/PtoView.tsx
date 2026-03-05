import { useState } from 'react';

import { useApp } from '@/contexts/AppContext';
import { getPtoDaysForYear } from '@/services/pto-constants';

export function PtoView() {
  const { ptoSettings } = useApp();

  if (!ptoSettings) {
    return <PtoSetup />;
  }

  return <PtoMain />;
}

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
        <div className="flex flex-col gap-2">
          <label className="text-left text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Year Employment Started
          </label>
          <select
            className="cursor-pointer rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 pr-10 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setStartYear(Number(e.target.value))}
            value={startYear}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-left text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Rollover Days (max 8)
          </label>
          <input
            className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            max={8}
            min={0}
            onChange={(e) => setRollover(Number(e.target.value))}
            type="number"
            value={rollover}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-left text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Your Initials
          </label>
          <input
            className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            maxLength={5}
            onChange={(e) => setInitials(e.target.value)}
            placeholder="e.g., JD"
            type="text"
            value={initials}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-left text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Supervisor Name
          </label>
          <input
            className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setSupervisor(e.target.value)}
            placeholder="e.g., Jane"
            type="text"
            value={supervisor}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-left text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Supervisor Email
          </label>
          <input
            className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., manager@company.com"
            type="email"
            value={email}
          />
        </div>
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

function PtoMain() {
  const { ptoSettings, ptoEntries } = useApp();

  if (!ptoSettings) {
    return null;
  }

  const totalDays =
    getPtoDaysForYear(ptoSettings.startYear) + ptoSettings.rolloverDays;
  const usedDays = ptoEntries.length;
  const remainingDays = totalDays - usedDays;
  const usedPct = totalDays > 0 ? Math.round((usedDays / totalDays) * 100) : 0;

  return (
    <div>
      <div className="mb-7 grid grid-cols-4 gap-3">
        {[
          { label: 'Total Days', value: String(totalDays), warn: false },
          { label: 'Used', value: String(usedDays), warn: false },
          {
            label: 'Remaining',
            value: String(remainingDays),
            warn: remainingDays <= 3,
          },
          { label: 'Used %', value: `${usedPct}%`, warn: false },
        ].map((stat) => (
          <div
            className={`rounded-xl border p-5 text-center ${
              stat.warn
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-wb-border bg-wb-surface'
            }`}
            key={stat.label}
          >
            <div
              className={`mb-1 font-mono text-[1.75rem] font-semibold ${stat.warn ? 'text-amber-500' : 'text-wb-accent'}`}
            >
              {stat.value}
            </div>
            <div className="text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-wb-border bg-wb-surface p-6">
        <h3 className="mb-5 font-semibold">2026 PTO History</h3>
        {ptoEntries.length === 0 ? (
          <div className="py-8 text-center text-wb-text-muted">
            No PTO entries yet. Use the calendar to request time off.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...ptoEntries]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((entry) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-wb-bg px-4 py-3"
                  key={entry.id}
                >
                  <div className="font-medium">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString(
                      'en-US',
                      { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </div>
                  <div className="rounded bg-wb-surface px-2 py-1 text-[0.75rem] uppercase tracking-wider text-wb-text-muted">
                    {entry.type}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
