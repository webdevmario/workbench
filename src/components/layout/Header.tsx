import { useState } from 'react';

import { StatsModal } from '@/components/stats/StatsModal';
import { SettingsModal } from '@/components/settings/SettingsModal';

export function Header() {
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="mb-6 flex items-center justify-between border-b border-wb-border pb-4">
        <div className="flex items-center gap-2.5 text-[1.25rem] font-semibold tracking-tight text-wb-text-muted">
          <span className="h-2 w-2 rounded-full bg-wb-accent" />
          Workbench
        </div>
        <div className="flex gap-2.5">
          <button
            className="flex items-center rounded-lg border border-wb-border bg-transparent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={() => setShowStats(true)}
            type="button"
          >
            <svg
              className="mr-1.5"
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Stats
          </button>
          <button
            className="flex items-center rounded-lg border border-wb-border bg-transparent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={() => setShowSettings(true)}
            type="button"
          >
            <svg
              className="mr-1.5"
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
      </header>

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
