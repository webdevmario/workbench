import { useEffect } from 'react';

import { AppNav } from '@/components/layout/AppNav';
import { Header } from '@/components/layout/Header';
import { MusicMiniBar } from '@/components/music/MusicMiniBar';
import { MusicView } from '@/components/music/MusicView';
import { NotesView } from '@/components/notes/NotesView';
import { PtoView } from '@/components/pto/PtoView';
import { ToastContainer } from '@/components/shared';
import { TasksView } from '@/components/tasks/TasksView';
import { TimerView } from '@/components/timer/TimerView';
import { useApp } from '@/contexts/AppContext';

export function AppShell() {
  const { activeView, setActiveView, featureToggles } = useApp();

  // Always reserve bottom space when music is enabled to prevent layout shifts
  const reserveMiniBarSpace = featureToggles.music;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (!mod) {
        return;
      }

      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (inInput) {
        return;
      }

      const tabs = (
        ['timer', 'tasks', 'notes', 'pto', 'music'] as const
      ).filter((t) => featureToggles[t]);

      if (e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key) - 1;

        if (tabs[idx]) {
          e.preventDefault();
          setActiveView(tabs[idx]);
        }
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setActiveView('tasks');
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setActiveView('notes');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, featureToggles]);

  return (
    <div
      className={`mx-auto max-w-[900px] p-10 ${reserveMiniBarSpace ? 'pb-20' : ''}`}
    >
      <Header />
      <AppNav />

      {activeView === 'timer' && <TimerView />}
      {activeView === 'tasks' && <TasksView />}
      {activeView === 'notes' && <NotesView />}
      {activeView === 'pto' && <PtoView />}

      {/* Music stays mounted so playback persists across tab switches */}
      {featureToggles.music && (
        <div className={activeView === 'music' ? '' : 'hidden'}>
          <MusicView />
        </div>
      )}

      <ToastContainer />
      {featureToggles.music && <MusicMiniBar />}
    </div>
  );
}
