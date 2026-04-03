import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

interface MusicPlayerControls {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

interface MusicPlayerState {
  // Playback state (read by mini bar)
  isPlaying: boolean;
  currentTitle: string;
  currentAuthor: string;
  currentVideoId: string;

  // Controls (called by mini bar, implemented by MusicView)
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;

  // Registration (called by MusicView to wire up controls)
  setPlaybackState: (
    isPlaying: boolean,
    title: string,
    author: string,
    videoId: string
  ) => void;
  registerControls: (controls: MusicPlayerControls) => void;
}

const MusicPlayerContext = createContext<MusicPlayerState | undefined>(
  undefined
);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState('');
  const controlsRef = useRef<MusicPlayerControls>({
    play: () => {},
    pause: () => {},
    next: () => {},
    prev: () => {},
  });

  const setPlaybackState = useCallback(
    (playing: boolean, title: string, author: string, videoId: string) => {
      setIsPlaying(playing);
      setCurrentTitle(title);
      setCurrentAuthor(author);
      setCurrentVideoId(videoId);
    },
    []
  );

  const registerControls = useCallback((controls: MusicPlayerControls) => {
    controlsRef.current = controls;
  }, []);

  const play = useCallback(() => controlsRef.current.play(), []);
  const pause = useCallback(() => controlsRef.current.pause(), []);
  const next = useCallback(() => controlsRef.current.next(), []);
  const prev = useCallback(() => controlsRef.current.prev(), []);

  const value = useMemo(
    () => ({
      isPlaying,
      currentTitle,
      currentAuthor,
      currentVideoId,
      play,
      pause,
      next,
      prev,
      setPlaybackState,
      registerControls,
    }),
    [
      isPlaying,
      currentTitle,
      currentAuthor,
      currentVideoId,
      play,
      pause,
      next,
      prev,
      setPlaybackState,
      registerControls,
    ]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerState {
  const ctx = useContext(MusicPlayerContext);

  if (!ctx) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }

  return ctx;
}
