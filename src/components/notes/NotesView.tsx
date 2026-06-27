import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';
import { NOTE_COLORS, NOTE_COLOR_KEYS } from '@/services/noteColors';
import type { Note, NoteColor } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onUpdate,
  onDelete,
  shouldFocus,
  onFocused,
}: {
  note: Note;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Note, 'title' | 'body' | 'color'>>
  ) => void;
  onDelete: (id: string) => void;
  shouldFocus: boolean;
  onFocused: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [highlighted, setHighlighted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const color = NOTE_COLORS[note.color];

  // Sync from store when the note changes underneath us.
  useEffect(() => {
    setTitle(note.title);
  }, [note.title]);
  useEffect(() => {
    setBody(note.body);
  }, [note.body]);

  // Auto-resize the body to fit content.
  useEffect(() => {
    const el = bodyRef.current;

    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  // Focus + highlight when targeted (e.g. just created).
  useEffect(() => {
    if (!shouldFocus) {
      return;
    }

    setHighlighted(true);

    const focusTimer = setTimeout(() => {
      const el = bodyRef.current;

      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    const doneTimer = setTimeout(() => {
      setHighlighted(false);
      onFocused();
    }, 1200);

    return () => {
      clearTimeout(focusTimer);
      clearTimeout(doneTimer);
    };
  }, [shouldFocus, onFocused]);

  const handleTitle = useCallback(
    (value: string) => {
      setTitle(value);
      if (titleTimer.current) {
        clearTimeout(titleTimer.current);
      }
      titleTimer.current = setTimeout(
        () => onUpdate(note.id, { title: value }),
        500
      );
    },
    [note.id, onUpdate]
  );

  const handleBody = useCallback(
    (value: string) => {
      setBody(value);
      if (bodyTimer.current) {
        clearTimeout(bodyTimer.current);
      }
      bodyTimer.current = setTimeout(
        () => onUpdate(note.id, { body: value }),
        500
      );
    },
    [note.id, onUpdate]
  );

  const flush = useCallback(() => {
    if (titleTimer.current) {
      clearTimeout(titleTimer.current);
    }
    if (bodyTimer.current) {
      clearTimeout(bodyTimer.current);
    }
    if (title !== note.title || body !== note.body) {
      onUpdate(note.id, { title, body });
    }
  }, [title, body, note.id, note.title, note.body, onUpdate]);

  const pickColor = useCallback(
    (c: NoteColor) => {
      onUpdate(note.id, { color: c });
      setPickerOpen(false);
    },
    [note.id, onUpdate]
  );

  return (
    <div
      className={`group mb-4 break-inside-avoid overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
        highlighted
          ? 'border-wb-accent ring-2 ring-wb-accent'
          : 'border-wb-border/40'
      }`}
      style={{ background: color.body }}
    >
      {/* Strip */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: color.strip }}
      >
        {/* Color picker */}
        <div className="relative flex-shrink-0">
          <button
            aria-label="Change color"
            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-black/25 transition-transform hover:scale-110"
            onClick={() => setPickerOpen((o) => !o)}
            style={{ background: 'rgba(0,0,0,0.12)' }}
            title="Change color"
            type="button"
          />
          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-[89]"
                onClick={() => setPickerOpen(false)}
              />
              <div className="absolute left-0 top-[calc(100%+6px)] z-[90] flex gap-1.5 rounded-lg border border-wb-border bg-wb-surface p-2 shadow-xl shadow-black/50">
                {NOTE_COLOR_KEYS.map((c) => (
                  <button
                    aria-label={c}
                    className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
                      c === note.color ? 'ring-2 ring-white ring-offset-1' : ''
                    }`}
                    key={c}
                    onClick={() => pickColor(c)}
                    style={{ background: NOTE_COLORS[c].strip }}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Title */}
        <input
          aria-label="Note title"
          className="min-w-0 flex-1 bg-transparent text-[0.85rem] font-semibold text-black/75 outline-none placeholder:text-black/35"
          onBlur={flush}
          onChange={(e) => handleTitle(e.target.value)}
          placeholder="Untitled"
          value={title}
        />

        {/* Time piece */}
        <span
          className="flex-shrink-0 cursor-default text-[0.62rem] text-black/45"
          title={`Created ${formatFull(note.createdAt)}\nEdited ${formatFull(note.updatedAt)}`}
        >
          {formatRelative(note.updatedAt)}
        </span>

        {/* Delete */}
        <button
          aria-label="Delete note"
          className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-black/40 opacity-0 transition-opacity hover:text-black/70 group-hover:opacity-100"
          onClick={() => onDelete(note.id)}
          title="Delete note"
          type="button"
        >
          <svg
            fill="none"
            height="10"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="10"
          >
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <textarea
        aria-label="Note body"
        className="w-full bg-transparent px-4 py-3.5 text-[0.9rem] leading-relaxed text-wb-text outline-none placeholder:text-wb-text-muted/35"
        onBlur={flush}
        onChange={(e) => handleBody(e.target.value)}
        placeholder="Write whatever you like..."
        ref={bodyRef}
        style={{ minHeight: '110px', overflow: 'hidden', resize: 'none' }}
        value={body}
      />
    </div>
  );
}

// ── NotesView ─────────────────────────────────────────────────────────────────

const NOTES_PAGE_SIZE = 20;

export function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [showCount, setShowCount] = useState(NOTES_PAGE_SIZE);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusingId, setFocusingId] = useState<string | null>(null);

  const handleNewNote = useCallback(() => {
    const note = addNote();

    setFocusingId(note.id);
  }, [addNote]);

  const handleFocused = useCallback(() => setFocusingId(null), []);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) {
      return [];
    }

    const q = searchQuery.toLowerCase();

    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      )
      .slice(0, 10)
      .map((n) => ({
        id: n.id,
        title: n.title || 'Untitled',
        preview: n.body.substring(0, 100).replace(/\n/g, ' '),
      }));
  }, [searchQuery, notes]);

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

  const displayed = notes.slice(0, showCount);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-[0.85rem] text-wb-text-muted">
          <strong className="font-semibold text-wb-text">{notes.length}</strong>{' '}
          note{notes.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center rounded-lg border border-wb-border bg-transparent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <svg
              className="mr-1.5 inline-block align-[-2px]"
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            Search
          </button>
          <button
            className="flex items-center rounded-lg bg-wb-accent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-bg transition-all hover:brightness-110"
            onClick={handleNewNote}
            type="button"
          >
            <svg
              className="mr-1.5 inline-block align-[-2px]"
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            New Note
          </button>
        </div>
      </div>

      {/* Sticky card grid */}
      {notes.length === 0 ? (
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
          </svg>
          <p>No notes yet — click New Note to start</p>
        </div>
      ) : (
        <div className="columns-2 gap-4">
          {displayed.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={(id) => setConfirmDeleteId(id)}
              onFocused={handleFocused}
              onUpdate={updateNote}
              shouldFocus={focusingId === note.id}
            />
          ))}
        </div>
      )}

      {notes.length > showCount && (
        <button
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-dashed border-wb-border p-4 text-[0.85rem] text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
          onClick={() => setShowCount((prev) => prev + NOTES_PAGE_SIZE)}
          type="button"
        >
          Show {Math.min(notes.length - showCount, NOTES_PAGE_SIZE)} more
        </button>
      )}

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
                    key={result.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      setFocusingId(result.id);
                      const idx = notes.findIndex((n) => n.id === result.id);

                      if (idx >= showCount) {
                        setShowCount(idx + 1);
                      }
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
        isOpen={!!confirmDeleteId}
        message="Delete this note?"
        okText="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteNote(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
        title="Delete Note"
      />
    </div>
  );
}
