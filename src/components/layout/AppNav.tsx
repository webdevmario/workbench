import { useApp } from '@/contexts/AppContext';
import type { AppView } from '@/types';

const TABS: { key: AppView; label: string }[] = [
  { key: 'timer', label: 'Time Tracker' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'notes', label: 'Notes' },
  { key: 'pto', label: 'PTO' },
];

export function AppNav() {
  const { activeView, setActiveView, featureToggles } = useApp();

  const visibleTabs = TABS.filter((tab) => featureToggles[tab.key]);

  return (
    <div className="mb-7 flex justify-center">
      <nav className="flex gap-1 rounded-[10px] border border-wb-border bg-wb-surface p-1">
        {visibleTabs.map((tab, index) => (
          <button
            className={`relative w-[140px] rounded-[7px] border-none px-6 py-2.5 text-center text-[0.875rem] font-medium transition-all ${
              activeView === tab.key
                ? 'bg-wb-accent text-wb-bg'
                : 'bg-transparent text-wb-text-muted hover:text-wb-text'
            }`}
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            type="button"
          >
            {tab.label}
            {index < visibleTabs.length - 1 &&
              activeView !== tab.key &&
              activeView !== visibleTabs[index + 1]?.key && (
                <span className="absolute -right-0.5 top-1/2 h-5 w-px -translate-y-1/2 bg-wb-border" />
              )}
          </button>
        ))}
      </nav>
    </div>
  );
}
