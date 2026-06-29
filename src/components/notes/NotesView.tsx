import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── NotesView ─────────────────────────────────────────────────────────────────

export function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable order: newest first, so editing never reshuffles under the stepper.
  const ordered = useMemo(
    () => [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes]
  );

  // Resolve the current note; default to the first when nothing is selected.
  const currentIndex = currentId
    ? ordered.findIndex((n) => n.id === currentId)
    : 0;
  const current = ordered[currentIndex] ?? null;

  // Keep selection valid as the list changes.
  useEffect(() => {
    if (ordered.length === 0) {
      if (currentId !== null) {
        setCurrentId(null);
      }

      return;
    }
    if (!current) {
      setCurrentId(ordered[0].id);
    }
  }, [ordered, current, currentId]);

  // Load the selected note's body into the editor.
  useEffect(() => {
    setContent(current?.body ?? '');
    setSaveStatus('');
  }, [current?.id, current?.body]);

  const focusEditor = useCallback(() => {
    setTimeout(() => {
      const el = editorRef.current;

      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 50);
  }, []);

  const wordCount = useMemo(() => {
    const t = content.trim();

    return t ? t.split(/\s+/).length : 0;
  }, [content]);

  const handleInput = useCallback(
    (value: string) => {
      setContent(value);
      if (!current) {
        return;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setSaveStatus('Saving...');
      saveTimeoutRef.current = setTimeout(() => {
        updateNote(current.id, value);
        setSaveStatus('Saved');
      }, 500);
    },
    [current, updateNote]
  );

  // Persist immediately, and drop the note if it was left empty.
  const flush = useCallback(() => {
    if (!current) {
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (content.trim() === '') {
      deleteNote(current.id);
    } else if (content !== current.body) {
      updateNote(current.id, content);
    }
  }, [current, content, deleteNote, updateNote]);

  const goTo = useCallback(
    (index: number) => {
      const target = ordered[index];

      if (!target || target.id === current?.id) {
        return;
      }
      flush();
      setCurrentId(target.id);
    },
    [ordered, current, flush]
  );

  const handleNew = useCallback(() => {
    // Reuse the current note if it's already empty — no empty pile-up.
    if (current && current.body.trim() === '') {
      focusEditor();

      return;
    }
    flush();
    const note = addNote();

    setCurrentId(note.id);
    focusEditor();
  }, [current, flush, addNote, focusEditor]);

  // Search (Cmd//) across note bodies.
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) {
      return [];
    }

    const q = searchQuery.toLowerCase();

    return ordered
      .filter((n) => n.body.toLowerCase().includes(q))
      .slice(0, 10)
      .map((n) => ({
        id: n.id,
        preview: n.body.substring(0, 100).replace(/\n/g, ' ') || 'Empty note',
        date: formatFull(n.createdAt),
      }));
  }, [searchQuery, ordered]);

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

  return (
    <div>
      {/* Header: note stepper + actions */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-wb-border disabled:hover:text-wb-text-muted"
            disabled={currentIndex <= 0}
            onClick={() => goTo(currentIndex - 1)}
            title="Newer note"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="min-w-[140px] text-center">
            {current ? (
              <span
                className="cursor-default font-medium"
                title={`Created ${formatFull(current.createdAt)}\nEdited ${formatFull(current.updatedAt)}`}
              >
                Note {currentIndex + 1} of {ordered.length}
                <span className="ml-2 text-[0.75rem] font-normal text-wb-text-muted">
                  edited {formatRelative(current.updatedAt)}
                </span>
              </span>
            ) : (
              <span className="text-wb-text-muted">No notes</span>
            )}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-surface text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-wb-border disabled:hover:text-wb-text-muted"
            disabled={currentIndex >= ordered.length - 1}
            onClick={() => goTo(currentIndex + 1)}
            title="Older note"
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
          {current && (
            <button
              className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-wb-border bg-transparent text-wb-text-muted transition-all hover:border-wb-danger hover:text-wb-danger"
              onClick={() => setConfirmDelete(true)}
              title="Delete note"
              type="button"
            >
              <svg
                fill="none"
                height="15"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="15"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          <button
            className="flex items-center rounded-lg bg-wb-accent px-3.5 py-[7px] text-[0.8rem] font-medium text-wb-bg transition-all hover:brightness-110"
            onClick={handleNew}
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

      {/* Editor / empty state */}
      {current ? (
        <>
          <textarea
            className="min-h-[60vh] w-full resize-none rounded-2xl border border-wb-border bg-wb-surface p-6 text-[0.95rem] leading-relaxed text-wb-text outline-none transition-colors focus:border-wb-accent"
            onBlur={flush}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Jot anything here..."
            ref={editorRef}
            value={content}
          />
          <div className="mt-2 flex items-center justify-end gap-4 px-1 text-[0.75rem] text-wb-text-muted">
            <span className="opacity-50">
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
            {saveStatus && (
              <span className={saveStatus === 'Saved' ? 'text-wb-accent' : ''}>
                {saveStatus}
              </span>
            )}
          </div>
        </>
      ) : (
        <button
          className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-wb-border text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
          onClick={handleNew}
          type="button"
        >
          <svg
            fill="none"
            height="48"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            width="48"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" x2="12" y1="12" y2="18" />
            <line x1="9" x2="15" y1="15" y2="15" />
          </svg>
          <span className="text-[0.9rem]">Create your first note</span>
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
                      flush();
                      setCurrentId(result.id);
                    }}
                  >
                    <div className="mb-0.5 text-[0.75rem] font-medium text-wb-accent">
                      {result.date}
                    </div>
                    <div className="truncate text-[0.85rem] text-wb-text">
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
        isOpen={confirmDelete}
        message="Delete this note?"
        okText="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (current) {
            deleteNote(current.id);
          }
          setConfirmDelete(false);
        }}
        title="Delete Note"
      />
    </div>
  );
}
