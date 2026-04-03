import { AppProvider } from '@/contexts/AppContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';

import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <AppProvider>
      <MusicPlayerProvider>
        <AppShell />
      </MusicPlayerProvider>
    </AppProvider>
  );
}
