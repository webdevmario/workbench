import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmDialog, Modal } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';
import { getTodayKey } from '@/services/dates';

const NOTES_PAGE_SIZE = 10;

export function NotesView() {
  const { notes, saveNote, deleteNote } = useApp();
  const [showCount, setShowCount] = useState(NOTES_PAGE_SIZE);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<string | null>(
    null
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState('');

  const sortedDates = useMemo(
    () => Object.keys(notes).sort((a, b) => b.localeCompare(a)),
    [notes]
  );

  const todayKey = getTodayKey();

  const openEditor = useCallback(
    (dateKey?: string) => {
      const date = dateKey || todayKey;

      setCurrentDate(date);
      setEditorContent(notes[date] || '');
      setEditorOpen(true);
      setSaveStatus('');
      setTimeout(() => editorRef.current?.focus(), 50);
    },
    [notes, todayKey]
  );

  const closeEditor = useCallback(() => {
    if (currentDate) {
      saveNote(currentDate, editorContent);
    }
    setEditorOpen(false);
    setCurrentDate(null);
    setShowCount(NOTES_PAGE_SIZE);
  }, [currentDate, editorContent, saveNote]);

  const handleEditorInput = useCallback(
    (value: string) => {
      setEditorContent(value);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setSaveStatus('Saving...');

      saveTimeoutRef.current = setTimeout(() => {
        if (currentDate) {
          saveNote(currentDate, value);
          setSaveStatus('Saved');
        }
      }, 500);
    },
    [currentDate, saveNote]
  );

  const handleDateChange = useCallback(
    (newDate: string) => {
      if (currentDate) {
        saveNote(currentDate, editorContent);
      }
      setCurrentDate(newDate);
      setEditorContent(notes[newDate] || '');
    },
    [currentDate, editorContent, notes, saveNote]
  );

  const wordCount = useMemo(() => {
    const content = editorContent.trim();

    return content ? content.split(/\s+/).length : 0;
  }, [editorContent]);

  // Search
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) {
      return [];
    }
    const q = searchQuery.toLowerCase();

    return sortedDates
      .filter((date) => notes[date].toLowerCase().includes(q))
      .slice(0, 10)
      .map((date) => ({
        date,
        preview: notes[date].substring(0, 100).replace(/\n/g, ' '),
        title: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
      }));
  }, [searchQuery, sortedDates, notes]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Formatting helpers
  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const el = editorRef.current;

      if (!el) {
        return;
      }

      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = editorContent.substring(start, end);
      const newVal =
        editorContent.substring(0, start) +
        before +
        selected +
        after +
        editorContent.substring(end);

      setEditorContent(newVal);
      handleEditorInput(newVal);
      setTimeout(() => {
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + selected.length;
        el.focus();
      }, 0);
    },
    [editorContent, handleEditorInput]
  );

  const recencyLabel = useMemo(() => {
    if (!sortedDates.length) {
      return '';
    }
    const newest = new Date(sortedDates[0] + 'T00:00:00');
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    const daysSince = Math.floor(
      (today.getTime() - newest.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 0) {
      return 'Last note today';
    }

    if (daysSince === 1) {
      return 'Last note yesterday';
    }

    return `Last note ${daysSince}d ago`;
  }, [sortedDates]);

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="text-[0.85rem] text-wb-text-muted">
          <strong className="font-semibold text-wb-text">
            {sortedDates.length}
          </strong>{' '}
          note{sortedDates.length !== 1 ? 's' : ''}
          {recencyLabel && (
            <>
              <span className="mx-1.5 opacity-30">·</span>
              <span className="text-[0.8rem] opacity-60">{recencyLabel}</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center rounded-lg border border-wb-border bg-transparent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <svg className="mr-1.5 inline-block align-[-2px]" fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>
            Search
          </button>
          <button
            className="flex items-center rounded-lg bg-wb-accent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-bg transition-all hover:brightness-110"
            onClick={() => openEditor()}
            type="button"
          >
            <svg className="mr-1.5 inline-block align-[-2px]" fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
            New Note
          </button>
        </div>
      </div>

      {/* Notes Cards */}
      <div className="flex flex-col gap-3">
        {sortedDates.length === 0 ? (
          <div className="py-16 text-center text-wb-text-muted">
            <svg
              className="mx-auto mb-4 opacity-30"
              fill="none"
              height="48"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="48"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
            </svg>
            <p>No notes yet</p>
          </div>
        ) : (
          sortedDates.slice(0, showCount).map((dateKey) => {
            const content = notes[dateKey];
            const d = new Date(dateKey + 'T00:00:00');
            const dateLabel = d.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const words = content.trim().split(/\s+/).length;
            const preview =
              content.length > 200
                ? content.substring(0, 200) + '...'
                : content;
            const isToday = dateKey === todayKey;

            return (
              <div
                className={`group cursor-pointer rounded-xl border bg-wb-surface px-6 py-5 transition-all hover:border-wb-accent hover:bg-wb-surface-hover ${
                  isToday
                    ? 'border-wb-accent bg-wb-accent-dim'
                    : 'border-wb-border'
                }`}
                key={dateKey}
                onClick={() => openEditor(dateKey)}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="font-mono text-[0.75rem] font-medium text-wb-accent">
                    {isToday && (
                      <span className="mr-2.5 inline-block rounded bg-wb-accent px-2 py-0.5 align-[1px] text-[0.65rem] font-semibold uppercase tracking-wider text-wb-bg">
                        Today
                      </span>
                    )}
                    {dateLabel}
                  </div>
                  <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-danger hover:text-wb-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteDate(dateKey);
                      }}
                      title="Delete"
                      type="button"
                    >
                      <svg
                        fill="none"
                        height="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="14"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="line-clamp-3 whitespace-pre-wrap break-words text-[0.9rem] leading-relaxed text-wb-text-muted">
                  {preview}
                </div>
                <div className="mt-2 text-[0.7rem] text-wb-text-muted opacity-50">
                  {words} word{words !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })
        )}

        {sortedDates.length > showCount && (
          <button
            className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-wb-border p-4 text-center text-[0.85rem] text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
            onClick={() => setShowCount((prev) => prev + NOTES_PAGE_SIZE)}
            type="button"
          >
            Show{' '}
            {Math.min(sortedDates.length - showCount, NOTES_PAGE_SIZE)} more
            <span className="text-[0.7rem] opacity-50">
              {sortedDates.length - showCount} remaining
            </span>
          </button>
        )}
      </div>

      {/* Note Editor Modal */}
      <Modal
        className="flex h-[80vh] w-[90vw] max-w-[840px] flex-col overflow-hidden"
        isOpen={editorOpen}
        onClose={closeEditor}
      >
        <h3 className="mb-4 font-medium">
          {currentDate && notes[currentDate] ? 'Edit Note' : 'New Note'}
        </h3>
        <div className="mb-3 max-w-[220px]">
          <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Date
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => handleDateChange(e.target.value)}
            type="date"
            value={currentDate || ''}
          />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
              onClick={() => wrapSelection('**', '**')}
              title="Bold"
              type="button"
            >
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
              onClick={() => {
                const el = editorRef.current;

                if (!el) {
                  return;
                }
                const start = el.selectionStart;
                const lineStart =
                  editorContent.lastIndexOf('\n', start - 1) + 1;
                const newContent =
                  editorContent.substring(0, lineStart) +
                  '- ' +
                  editorContent.substring(lineStart);

                handleEditorInput(newContent);
              }}
              title="List"
              type="button"
            >
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <line x1="9" x2="20" y1="6" y2="6" />
                <line x1="9" x2="20" y1="12" y2="12" />
                <line x1="9" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
              onClick={() => wrapSelection('`', '`')}
              title="Code"
              type="button"
            >
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4 text-[0.75rem] text-wb-text-muted">
            <span className="opacity-50">
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
            {saveStatus && (
              <span className={saveStatus === 'Saved' ? 'text-wb-accent' : ''}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <textarea
            className="flex-1 resize-none rounded-[10px] border border-wb-border bg-wb-bg p-5 font-mono text-[0.9rem] leading-[1.8] text-wb-text outline-none transition-colors focus:border-wb-accent"
            onChange={(e) => handleEditorInput(e.target.value)}
            placeholder="Start writing..."
            ref={editorRef}
            value={editorContent}
          />
        </div>
        <div className="-mx-8 -mb-8 mt-4 flex justify-end border-t border-wb-border px-8 py-4">
          <button
            className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={closeEditor}
            type="button"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 pt-[15vh] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSearchOpen(false);
              setSearchQuery('');
            }
          }}
        >
          <div className="w-full max-w-[540px] overflow-hidden rounded-2xl border border-wb-border bg-wb-surface shadow-xl shadow-black/60">
            <div className="flex items-center gap-3 border-b border-wb-border px-5 py-4">
              <svg
                className="flex-shrink-0 text-wb-text-muted"
                fill="none"
                height="18"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="18"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
              <input
                autoFocus
                className="flex-1 bg-transparent text-[1.1rem] text-wb-text outline-none placeholder:text-wb-text-muted/60"
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }
                }}
                placeholder="Search notes..."
                type="text"
                value={searchQuery}
              />
              <span className="flex-shrink-0 text-[0.7rem] text-wb-text-muted opacity-50">
                <kbd className="rounded border border-wb-border bg-wb-bg px-1.5 py-0.5 font-mono text-[0.65rem] text-wb-text-muted">
                  esc
                </kbd>
              </span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {searchQuery.length < 2 ? (
                <div className="px-6 py-8 text-center text-[0.85rem] text-wb-text-muted opacity-50">
                  Type to search your notes
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-6 py-8 text-center text-[0.85rem] text-wb-text-muted">
                  No notes found
                </div>
              ) : (
                searchResults.map((result) => (
                  <div
                    className="cursor-pointer border-b border-wb-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-wb-accent-dim"
                    key={result.date}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      openEditor(result.date);
                    }}
                  >
                    <div className="mb-0.5 text-[0.9rem] font-medium">
                      {result.title}
                    </div>
                    <div className="truncate text-[0.75rem] text-wb-text-muted">
                      {result.preview}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        danger
        isOpen={!!confirmDeleteDate}
        message="Delete this note?"
        okText="Delete"
        onCancel={() => setConfirmDeleteDate(null)}
        onConfirm={() => {
          if (confirmDeleteDate) {
            deleteNote(confirmDeleteDate);
          }
          setConfirmDeleteDate(null);
        }}
        title="Delete Note"
      />
    </div>
  );
}
