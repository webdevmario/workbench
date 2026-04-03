import { useApp } from '@/contexts/AppContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export function MusicMiniBar() {
  const { activeView, setActiveView } = useApp();
  const {
    isPlaying,
    currentTitle,
    currentAuthor,
    currentVideoId,
    play,
    pause,
    next,
    prev,
  } = useMusicPlayer();

  // Only show when music is playing/paused with a track, and not on the music tab
  if (activeView === 'music' || !currentTitle) {
    return null;
  }

  const youtubeUrl = currentVideoId
    ? `https://www.youtube.com/watch?v=${currentVideoId}`
    : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-wb-border bg-wb-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex items-center justify-center gap-3 py-2.5">
        {/* Play/Pause */}
        <button
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-wb-accent text-wb-bg transition-all hover:brightness-110"
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause' : 'Play'}
          type="button"
        >
          {isPlaying ? (
            <svg fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              fill="currentColor"
              height="14"
              style={{ marginLeft: '1px' }}
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Previous */}
        <button
          className="flex-shrink-0 p-1 text-wb-text-muted transition-colors hover:text-wb-text"
          onClick={prev}
          title="Previous"
          type="button"
        >
          <svg fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Next */}
        <button
          className="flex-shrink-0 p-1 text-wb-text-muted transition-colors hover:text-wb-text"
          onClick={next}
          title="Next"
          type="button"
        >
          <svg fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Track info — fixed width */}
        <div className="w-[280px] flex-shrink-0">
          {youtubeUrl ? (
            <a
              className="block transition-colors hover:opacity-80"
              href={youtubeUrl}
              rel="noopener noreferrer"
              target="_blank"
              title={
                currentAuthor
                  ? `${currentTitle} — ${currentAuthor}`
                  : currentTitle
              }
            >
              <p className="truncate text-[0.9rem] font-medium text-wb-text">
                {currentTitle}
              </p>
            </a>
          ) : (
            <button
              className="w-full text-left transition-colors hover:opacity-80"
              onClick={() => setActiveView('music')}
              title={
                currentAuthor
                  ? `${currentTitle} — ${currentAuthor}`
                  : currentTitle
              }
              type="button"
            >
              <p className="truncate text-[0.9rem] font-medium text-wb-text">
                {currentTitle}
              </p>
            </button>
          )}
        </div>

        {/* Mini visualizer */}
        <div className="flex h-5 flex-shrink-0 items-end gap-[2px]">
          {Array.from({ length: 5 }, (_, i) => {
            const peak = 0.4 + (i % 3) * 0.2;
            const duration = 0.4 + (i % 3) * 0.15;
            const delay = i * 0.1;

            return (
              <div
                className="h-full w-[2px] origin-bottom rounded-sm bg-wb-accent/60"
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
      </div>
    </div>
  );
}
