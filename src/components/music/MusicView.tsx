import { useCallback, useEffect, useRef, useState } from 'react';

import { useApp } from '@/contexts/AppContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  playVideoAt: (index: number) => void;
  setVolume: (vol: number) => void;
  getVolume: () => number;
  getPlayerState: () => number;
  getVideoData: () => { title: string; author: string; video_id: string };
  getVideoUrl: () => string;
  getPlaylistIndex: () => number;
  getPlaylist: () => string[];
  setShuffle: (shuffle: boolean) => void;
  setLoop: (loop: boolean) => void;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        config: {
          height: string;
          width: string;
          playerVars: Record<string, string | number>;
          events: Record<string, (e: YTPlayerEvent) => void>;
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// Player state constants
const YT_PLAYING = 1;
const YT_PAUSED = 2;

function extractPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const list = parsed.searchParams.get('list');

    if (list) {
      return list;
    }
  } catch {
    // Not a URL — try as raw ID
    if (/^[a-zA-Z0-9_-]+$/.test(url.trim())) {
      return url.trim();
    }
  }

  return null;
}

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve();

      return;
    }

    const existing = document.getElementById('yt-iframe-api');

    if (existing) {
      // Script is loading, wait for callback
      const prev = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };

      return;
    }

    window.onYouTubeIframeAPIReady = () => resolve();

    const tag = document.createElement('script');

    tag.id = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

export function MusicView() {
  const { musicSettings, updateMusicSettings, showToast } = useApp();
  const { setPlaybackState, registerControls } = useMusicPlayer();

  const [inputUrl, setInputUrl] = useState(musicSettings.playlistUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [volume, setVolume] = useState(50);
  const [isLoaded, setIsLoaded] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [trackCount, setTrackCount] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [showTracklist, setShowTracklist] = useState(false);
  const [trackTitles, setTrackTitles] = useState<Record<number, string>>({});
  const [currentVideoId, setCurrentVideoId] = useState('');

  const fetchTrackTitles = useCallback((videoIds: string[]) => {
    videoIds.forEach((videoId, i) => {
      fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`
      )
        .then((res) => {
          if (!res.ok) {
            return null;
          }

          return res.json();
        })
        .then((data) => {
          if (data?.title) {
            setTrackTitles((prev) => {
              if (prev[i] === data.title) {
                return prev;
              }

              return { ...prev, [i]: data.title };
            });
          }
        })
        .catch(() => {
          // Silently skip — title will show as "Track N"
        });
    });
  }, []);

  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateTrackInfo = useCallback(() => {
    const p = playerRef.current;

    if (!p) {
      return;
    }

    try {
      const data = p.getVideoData();
      const idx = p.getPlaylistIndex();

      if (data.title) {
        setCurrentTitle(data.title);
        setCurrentAuthor(data.author || '');

        if (data.video_id) {
          setCurrentVideoId(data.video_id);
        }

        setTrackTitles((prev) => {
          if (prev[idx] === data.title) {
            return prev;
          }

          return { ...prev, [idx]: data.title };
        });
      }

      setTrackIndex(idx);

      const playlist = p.getPlaylist();

      if (playlist) {
        setTrackCount(playlist.length);
      }
    } catch {
      // Player may not be ready
    }
  }, []);

  const initPlayer = useCallback(
    async (playlistId: string) => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      setIsLoaded(false);
      setCurrentTitle('');
      setCurrentAuthor('');
      setTrackTitles({});

      await loadYTApi();

      if (!containerRef.current) {
        return;
      }

      // Clear container and create a fresh div for the player
      containerRef.current.innerHTML = '';

      const playerEl = document.createElement('div');

      playerEl.id = 'wb-yt-player';
      containerRef.current.appendChild(playerEl);

      playerRef.current = new window.YT.Player('wb-yt-player', {
        height: '200',
        width: '356',
        playerVars: {
          list: playlistId,
          listType: 'playlist',
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          // eslint-disable-next-line camelcase
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: YTPlayerEvent) => {
            e.target.setVolume(50);
            setIsLoaded(true);
            updateTrackInfo();

            const ids = e.target.getPlaylist();

            if (ids?.length) {
              setTrackCount(ids.length);
              fetchTrackTitles(ids);
            }
          },
          onStateChange: (e: YTPlayerEvent) => {
            setIsPlaying(e.data === YT_PLAYING);

            if (e.data === YT_PLAYING || e.data === YT_PAUSED) {
              updateTrackInfo();
            }
          },
        },
      });

      // Poll for track info updates
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      pollRef.current = setInterval(updateTrackInfo, 2000);
    },
    [fetchTrackTitles, updateTrackInfo]
  );

  // Initialize player if we have a saved playlist
  useEffect(() => {
    if (musicSettings.playlistUrl) {
      const id = extractPlaylistId(musicSettings.playlistUrl);

      if (id) {
        initPlayer(id);
      }
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync playback state to shared context for the mini bar
  useEffect(() => {
    setPlaybackState(isPlaying, currentTitle, currentAuthor, currentVideoId);
  }, [
    isPlaying,
    currentTitle,
    currentAuthor,
    currentVideoId,
    setPlaybackState,
  ]);

  // Register player controls so the mini bar can call them
  useEffect(() => {
    registerControls({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      next: () => playerRef.current?.nextVideo(),
      prev: () => playerRef.current?.previousVideo(),
    });
  }, [registerControls]);

  const handleLoadPlaylist = useCallback(() => {
    const id = extractPlaylistId(inputUrl);

    if (!id) {
      showToast('Could not find a playlist ID in that URL', 'error');

      return;
    }

    updateMusicSettings({ playlistUrl: inputUrl });
    initPlayer(id);
  }, [inputUrl, initPlayer, showToast, updateMusicSettings]);

  const handlePlay = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const handlePause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const handleNext = useCallback(() => {
    playerRef.current?.nextVideo();
  }, []);

  const handlePrev = useCallback(() => {
    playerRef.current?.previousVideo();
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value);

      setVolume(v);
      playerRef.current?.setVolume(v);
    },
    []
  );

  const handleShuffle = useCallback(() => {
    const next = !shuffle;

    setShuffle(next);
    playerRef.current?.setShuffle(next);
  }, [shuffle]);

  const handleJumpToTrack = useCallback((index: number) => {
    playerRef.current?.playVideoAt(index);
  }, []);

  const handleClear = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      playerRef.current.destroy();
      playerRef.current = null;
    }

    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    setIsLoaded(false);
    setIsPlaying(false);
    setCurrentTitle('');
    setCurrentAuthor('');
    setTrackTitles({});
    setInputUrl('');
    updateMusicSettings({ playlistUrl: '' });
  }, [updateMusicSettings]);

  const hasPlaylist = isLoaded && musicSettings.playlistUrl;

  return (
    <div className="flex flex-col items-center">
      {/* Playlist input */}
      <div className="mb-6 w-full max-w-[500px]">
        <label
          className="mb-2 block text-[0.8rem] text-wb-text-muted"
          htmlFor="wb-playlist-url"
        >
          YouTube Playlist
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-wb-border bg-wb-surface px-4 py-2.5 text-[0.875rem] text-wb-text placeholder-wb-text-muted/50 outline-none transition-colors focus:border-wb-accent"
            id="wb-playlist-url"
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLoadPlaylist();
              }
            }}
            placeholder="Paste playlist URL..."
            type="text"
            value={inputUrl}
          />
          <button
            className="rounded-lg border border-wb-border bg-wb-surface px-4 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface-hover hover:text-wb-text"
            onClick={handleLoadPlaylist}
            type="button"
          >
            Load
          </button>
          {hasPlaylist && (
            <button
              className="rounded-lg border border-wb-border bg-wb-surface px-3 py-2.5 text-wb-text-muted transition-all hover:border-wb-danger/40 hover:text-wb-danger"
              onClick={handleClear}
              title="Clear playlist"
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
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Player card */}
      {musicSettings.playlistUrl && (
        <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-wb-border bg-wb-surface">
          {/* Video embed */}
          <div
            className="relative w-full overflow-hidden bg-black"
            style={{ aspectRatio: '16 / 9', maxHeight: '200px' }}
          >
            <div
              className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full"
              ref={containerRef}
            />
            {/* Cover: loading state, idle thumbnail, or hover overlay */}
            {!isLoaded ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-wb-bg">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-wb-border border-t-wb-accent" />
                  <span className="text-[0.8rem] text-wb-text-muted">
                    Loading playlist...
                  </span>
                </div>
              </div>
            ) : !isPlaying ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-wb-bg">
                {currentVideoId ? (
                  <img
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                    src={`https://img.youtube.com/vi/${currentVideoId}/hqdefault.jpg`}
                  />
                ) : null}
                <div className="relative flex flex-col items-center gap-2">
                  <svg
                    className="text-wb-accent/40"
                    fill="none"
                    height="32"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="32"
                  >
                    <circle cx="5.5" cy="17.5" r="2.5" />
                    <circle cx="17.5" cy="15.5" r="2.5" />
                    <path d="M8 17.5V5l12-2v12.5" />
                  </svg>
                  {currentTitle && (
                    <span className="text-[0.75rem] text-wb-text-muted/60">
                      Paused
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Transparent overlay to block YouTube hover UI during playback */}
                <div className="absolute inset-0 z-10 cursor-default" />
                {/* Open in YouTube link */}
                {currentVideoId && (
                  <a
                    className="absolute bottom-2 right-2 z-20 rounded bg-wb-bg/70 px-2 py-1 text-[0.65rem] text-wb-text-muted opacity-0 transition-opacity hover:text-wb-text [div:hover>&]:opacity-100"
                    href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    title="Open on YouTube"
                  >
                    YouTube
                  </a>
                )}
              </>
            )}
          </div>

          {/* Visualizer */}
          <div className="flex h-8 items-end justify-center gap-[3px] px-5 pt-3">
            {Array.from({ length: 32 }, (_, i) => {
              const peak = 0.3 + Math.sin(i * 0.7) * 0.25 + (i % 3) * 0.15;
              const duration = 0.4 + (i % 5) * 0.15;
              const delay = (i % 7) * 0.08;

              return (
                <div
                  className="h-full w-[3px] origin-bottom rounded-sm bg-wb-accent/60"
                  key={i}
                  style={
                    isPlaying
                      ? {
                          animation: `viz-bar ${duration}s ease-in-out ${delay}s infinite`,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          ['--viz-peak' as any]: peak,
                        }
                      : {
                          transform: 'scaleY(0.15)',
                          transition: 'transform 0.4s ease',
                        }
                  }
                />
              );
            })}
          </div>

          {/* Track info + controls */}
          <div className="p-5">
            {/* Track info — fixed height to prevent layout shift */}
            <div className="mb-4 h-[54px]">
              {currentTitle ? (
                <>
                  <p className="text-[0.9rem] font-medium text-wb-text">
                    {currentTitle}
                  </p>
                  <p className="text-[0.8rem] text-wb-text-muted">
                    {currentAuthor || '\u00A0'}
                  </p>
                  {trackCount > 0 && (
                    <p className="mt-0.5 text-[0.75rem] text-wb-text-muted/60">
                      Track {trackIndex + 1} of {trackCount}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[0.9rem] font-medium text-wb-text-muted/50">
                    Ready to play
                  </p>
                  <p className="text-[0.8rem] text-wb-text-muted/30">
                    {'\u00A0'}
                  </p>
                </>
              )}
            </div>

            {/* Transport controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Shuffle */}
              <button
                className={`rounded-lg p-2 transition-all ${
                  shuffle
                    ? 'text-wb-accent'
                    : 'text-wb-text-muted hover:text-wb-text'
                }`}
                onClick={handleShuffle}
                title="Shuffle"
                type="button"
              >
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" x2="21" y1="20" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" x2="21" y1="15" y2="21" />
                  <line x1="4" x2="9" y1="4" y2="9" />
                </svg>
              </button>

              {/* Previous */}
              <button
                className="rounded-lg p-2 text-wb-text-muted transition-all hover:text-wb-text"
                onClick={handlePrev}
                title="Previous"
                type="button"
              >
                <svg
                  fill="currentColor"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-wb-accent text-wb-bg transition-all hover:brightness-110"
                onClick={isPlaying ? handlePause : handlePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                type="button"
              >
                {isPlaying ? (
                  <svg
                    fill="currentColor"
                    height="20"
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg
                    fill="currentColor"
                    height="20"
                    style={{ marginLeft: '2px' }}
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next */}
              <button
                className="rounded-lg p-2 text-wb-text-muted transition-all hover:text-wb-text"
                onClick={handleNext}
                title="Next"
                type="button"
              >
                <svg
                  fill="currentColor"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              {/* Tracklist toggle */}
              <button
                className={`rounded-lg p-2 transition-all ${
                  showTracklist
                    ? 'text-wb-accent'
                    : 'text-wb-text-muted hover:text-wb-text'
                }`}
                onClick={() => setShowTracklist((v) => !v)}
                title="Track list"
                type="button"
              >
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <line x1="8" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                  <line x1="3" x2="3.01" y1="6" y2="6" />
                  <line x1="3" x2="3.01" y1="12" y2="12" />
                  <line x1="3" x2="3.01" y1="18" y2="18" />
                </svg>
              </button>

              {/* Volume */}
              <div className="ml-2 flex items-center gap-2">
                <svg
                  className="text-wb-text-muted"
                  fill="currentColor"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  {volume === 0 ? (
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  ) : volume < 50 ? (
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  ) : (
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </svg>
                <input
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-wb-border accent-wb-accent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-wb-accent"
                  max="100"
                  min="0"
                  onChange={handleVolumeChange}
                  type="range"
                  value={volume}
                />
              </div>
            </div>
          </div>

          {/* Track list panel */}
          {showTracklist && trackCount > 0 && (
            <div className="border-t border-wb-border">
              <div className="max-h-[240px] overflow-y-auto">
                {Array.from({ length: trackCount }, (_, i) => (
                  <button
                    className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                      i === trackIndex
                        ? 'bg-wb-accent-dim'
                        : 'hover:bg-wb-surface-hover'
                    }`}
                    key={i}
                    onClick={() => handleJumpToTrack(i)}
                    type="button"
                  >
                    <span
                      className={`w-6 flex-shrink-0 text-right font-mono text-[0.75rem] ${
                        i === trackIndex
                          ? 'text-wb-accent'
                          : 'text-wb-text-muted/50'
                      }`}
                    >
                      {i === trackIndex && isPlaying ? (
                        <svg
                          className="ml-auto text-wb-accent"
                          fill="currentColor"
                          height="12"
                          viewBox="0 0 24 24"
                          width="12"
                        >
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={`truncate text-[0.8rem] ${
                        i === trackIndex
                          ? 'font-medium text-wb-accent'
                          : 'text-wb-text-muted'
                      }`}
                    >
                      {trackTitles[i] || `Track ${i + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!musicSettings.playlistUrl && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-wb-accent-dim">
            <svg
              className="text-wb-accent"
              fill="none"
              height="28"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              width="28"
            >
              <circle cx="5.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="15.5" r="2.5" />
              <path d="M8 17.5V5l12-2v12.5" />
            </svg>
          </div>
          <p className="mb-1 text-[0.9rem] font-medium text-wb-text">
            No playlist loaded
          </p>
          <p className="max-w-[300px] text-[0.8rem] text-wb-text-muted">
            Paste a YouTube playlist URL above to start playing music while you
            work.
          </p>
        </div>
      )}
    </div>
  );
}
