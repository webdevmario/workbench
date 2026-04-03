import { useCallback, useRef, useState } from 'react';

import { ConfirmDialog, Modal } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';
import {
  getCategories,
  getNotes,
  getPtoEntries,
  getTasks,
  getTimeEntries,
  setCategories,
  setNotes,
  setPtoEntries,
  setPtoHolidays,
  setPtoSettings,
  setTasks,
  setTimeEntries,
} from '@/services/storage';
import type { FeatureToggles } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'features' | 'data' | 'shortcuts' | 'danger';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    featureToggles,
    updateFeatureToggles,
    exportData,
    clearAllData,
    reloadAll,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('features');
  const [showClearConfirm1, setShowClearConfirm1] = useState(false);
  const [showClearConfirm2, setShowClearConfirm2] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback(
    (key: keyof FeatureToggles) => {
      updateFeatureToggles({ ...featureToggles, [key]: !featureToggles[key] });
    },
    [featureToggles, updateFeatureToggles]
  );

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const hasEntries = data.entries && Array.isArray(data.entries);
          const hasTasks = data.tasks && Array.isArray(data.tasks);
          const hasNotes = data.notes && typeof data.notes === 'object';
          const hasPto = data.pto && typeof data.pto === 'object';

          if (!hasEntries && !hasTasks && !hasNotes && !hasPto) {
            showToast('Invalid file: no data found', 'error');

            return;
          }

          // Merge logic
          if (hasEntries) {
            const existing = getTimeEntries();
            const ids = new Set(existing.map((e) => e.id));

            setTimeEntries([
              ...existing,
              ...data.entries.filter((e: { id: string }) => !ids.has(e.id)),
            ]);
          }

          if (hasTasks) {
            const existing = getTasks();
            const ids = new Set(existing.map((t) => t.id));

            setTasks([
              ...existing,
              ...data.tasks.filter((t: { id: string }) => !ids.has(t.id)),
            ]);
          }

          if (data.categories) {
            setCategories([
              ...new Set([...getCategories(), ...data.categories]),
            ]);
          }

          if (hasNotes) {
            const existing = getNotes();

            Object.entries(data.notes).forEach(
              ([date, content]: [string, unknown]) => {
                if (!existing[date]) {
                  existing[date] = content as string;
                }
              }
            );

            setNotes(existing);
          }

          if (hasPto) {
            if (data.pto.entries) {
              const existing = getPtoEntries();
              const ids = new Set(existing.map((e) => e.id));

              setPtoEntries([
                ...existing,
                ...data.pto.entries.filter(
                  (e: { id: string }) => !ids.has(e.id)
                ),
              ]);
            }

            if (data.pto.settings) {
              setPtoSettings(data.pto.settings);
            }

            if (data.pto.holidays && data.pto.holidays.length > 0) {
              setPtoHolidays(data.pto.holidays);
            }
          }

          reloadAll();
          showToast('Import complete!', 'success');
        } catch (err) {
          showToast(
            'Error: ' + (err instanceof Error ? err.message : 'Unknown'),
            'error'
          );
        }
      };

      reader.readAsText(file);

      if (event.target) {
        event.target.value = '';
      }
    },
    [reloadAll, showToast]
  );

  const handleClear = useCallback(() => {
    clearAllData();
    onClose();
    window.location.reload();
  }, [clearAllData, onClose]);

  const features: {
    icon: JSX.Element;
    key: keyof FeatureToggles;
    label: string;
  }[] = [
    {
      key: 'timer',
      label: 'Time Tracker',
      icon: (
        <svg
          fill="none"
          height="15"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="15"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: 'tasks',
      label: 'Tasks',
      icon: (
        <svg
          fill="none"
          height="15"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="15"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      icon: (
        <svg
          fill="none"
          height="15"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="15"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      key: 'pto',
      label: 'PTO',
      icon: (
        <svg
          fill="none"
          height="15"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="15"
        >
          <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      key: 'music',
      label: 'Music',
      icon: (
        <svg
          fill="none"
          height="15"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="15"
        >
          <circle cx="5.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="15.5" r="2.5" />
          <path d="M8 17.5V5l12-2v12.5" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Modal
        className="flex h-[560px] w-full max-w-[520px] flex-col"
        isOpen={isOpen}
        onClose={onClose}
      >
        <h3 className="mb-0 flex-shrink-0 font-medium">Settings</h3>

        {/* Tabs */}
        <div className="-mx-8 mb-6 mt-4 flex flex-shrink-0 border-b border-wb-border px-8">
          {(
            [
              ['features', 'Features'],
              ['data', 'Data'],
              ['shortcuts', 'Shortcuts'],
              ['danger', 'Danger Zone'],
            ] as [SettingsTab, string][]
          ).map(([tab, label]) => (
            <button
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[0.8rem] font-medium transition-all ${
                activeTab === tab
                  ? 'border-wb-accent text-wb-accent'
                  : 'border-transparent text-wb-text-muted hover:text-wb-text'
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeTab === 'features' && (
            <div>
              <p className="mb-4 text-[0.8rem] text-wb-text-muted opacity-70">
                Toggle which tools appear in the nav bar. Your data is always
                preserved.
              </p>
              <div className="flex flex-col">
                {features.map((f) => (
                  <label
                    className="flex cursor-pointer select-none items-center justify-between border-b border-wb-border py-3 last:border-b-0"
                    key={f.key}
                  >
                    <span className="flex items-center gap-2.5 text-[0.9rem] text-wb-text-muted">
                      {f.icon}
                      <span className="text-wb-text">{f.label}</span>
                    </span>
                    <div
                      className={`relative h-[22px] w-10 flex-shrink-0 rounded-full transition-colors ${
                        featureToggles[f.key]
                          ? 'bg-wb-accent-dim'
                          : 'bg-wb-border'
                      }`}
                      onClick={() => handleToggle(f.key)}
                    >
                      <div
                        className={`absolute top-[3px] h-4 w-4 rounded-full transition-all ${
                          featureToggles[f.key]
                            ? 'left-[21px] bg-wb-accent'
                            : 'left-[3px] bg-wb-text-muted'
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <div className="flex gap-3">
                <button
                  className="flex flex-1 items-center justify-center rounded-lg border border-wb-border bg-transparent px-5 py-3.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
                  onClick={() => importRef.current?.click()}
                  type="button"
                >
                  Import Data
                </button>
                <button
                  className="flex flex-1 items-center justify-center rounded-lg border border-wb-border bg-transparent px-5 py-3.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
                  onClick={exportData}
                  type="button"
                >
                  Export Data
                </button>
              </div>
              <input
                accept=".json"
                className="hidden"
                onChange={handleImport}
                ref={importRef}
                type="file"
              />
              <p className="mt-3 text-[0.8rem] text-wb-text-muted opacity-70">
                Export creates a backup of all your time entries, tasks, notes,
                categories, and PTO data.
              </p>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="flex flex-col">
              {[
                ['Search notes', '⌘ /'],
                ['New task', '⌘ K'],
                ['New note', '⌘ J'],
                ['Switch to Time Tracker', '⌘ 1'],
                ['Switch to Tasks', '⌘ 2'],
                ['Switch to Notes', '⌘ 3'],
                ['Switch to PTO', '⌘ 4'],
                ['Switch to Music', '⌘ 5'],
                ['Save (in any modal)', '⌘ S'],
                ['Save & close note', '⌘ ↩'],
              ].map(([label, keys]) => (
                <div
                  className="flex items-center justify-between border-b border-wb-border py-2.5 last:border-b-0"
                  key={label}
                >
                  <span className="text-[0.85rem] text-wb-text-muted">
                    {label}
                  </span>
                  <div className="flex gap-1">
                    {keys.split(' ').map((k) => (
                      <kbd
                        className="min-w-[24px] rounded border border-wb-border bg-wb-bg px-[7px] py-[3px] text-center font-mono text-[0.7rem] text-wb-text"
                        key={k}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
              <p className="mt-4 pb-4 text-[0.8rem] text-wb-text-muted opacity-70">
                On Windows/Linux, use Ctrl instead of ⌘
              </p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="mb-4 text-[0.85rem] text-wb-text-muted">
                Permanently delete all your data and start fresh. This cannot be
                undone.
              </p>
              <button
                className="flex items-center justify-center rounded-lg border border-red-500 bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-red-400 transition-all hover:bg-red-500/10"
                onClick={() => setShowClearConfirm1(true)}
                type="button"
              >
                Clear All Data
              </button>
            </div>
          )}
        </div>

        <div className="-mx-8 -mb-8 mt-auto flex flex-shrink-0 justify-end border-t border-wb-border px-8 py-4">
          <button
            className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        danger
        isOpen={showClearConfirm1}
        message="This will permanently delete all your time entries, tasks, notes, categories, and PTO data. This cannot be undone."
        okText="Delete Everything"
        onCancel={() => setShowClearConfirm1(false)}
        onConfirm={() => {
          setShowClearConfirm1(false);
          setShowClearConfirm2(true);
        }}
        title="Delete All Data"
      />

      <ConfirmDialog
        danger
        isOpen={showClearConfirm2}
        message="This is your last chance to cancel. All data will be permanently lost."
        okText="Yes, delete all"
        onCancel={() => setShowClearConfirm2(false)}
        onConfirm={handleClear}
        title="Are you sure?"
      />
    </>
  );
}
