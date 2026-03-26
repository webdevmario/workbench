import { useCallback, useMemo, useRef, useState } from 'react';

import { ConfirmDialog, Modal } from '@/components/shared';
import { useApp } from '@/contexts/AppContext';
import { formatRelativeDate } from '@/services/dates';
import type { TaskFilter } from '@/types';

export function TasksView() {
  const { tasks, addTask, toggleTask, updateTask, deleteTask, reorderTasks } =
    useApp();

  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');
  const [title, setTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const draggedId = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'above' | 'below';
  } | null>(null);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (taskFilter === 'active') {
      filtered = tasks.filter((t) => !t.done);
    } else if (taskFilter === 'done') {
      filtered = tasks.filter((t) => t.done);
    }

    if (taskFilter === 'active') {
      return [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    if (taskFilter === 'done') {
      return [...filtered].sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      );
    }

    const undone = filtered
      .filter((t) => !t.done)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const done = filtered
      .filter((t) => t.done)
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      );

    return [...undone, ...done];
  }, [tasks, taskFilter]);

  const totalDone = tasks.filter((t) => t.done).length;

  const handleAddTask = useCallback(() => {
    if (!title.trim()) {
      titleRef.current?.focus();

      return;
    }

    addTask(title.trim(), taskNotes.trim());
    setTitle('');
    setTaskNotes('');
    setTaskFilter('active');
  }, [title, taskNotes, addTask]);

  const handleToggle = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);

      if (task && !task.done) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 900);
      }

      toggleTask(id);
    },
    [tasks, toggleTask]
  );

  const handleSaveEdit = useCallback(() => {
    if (editingId) {
      updateTask(editingId, {
        title: editTitle.trim(),
        notes: editNotes.trim(),
      });
      setEditingId(null);
    }
  }, [editingId, editTitle, editNotes, updateTask]);

  // Drag & drop
  const handleDragStart = (id: string) => {
    draggedId.current = id;
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (!draggedId.current || draggedId.current === taskId) {
      setDropTarget(null);

      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    setDropTarget((prev) =>
      prev?.id === taskId && prev.position === position
        ? prev
        : { id: taskId, position }
    );
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetId: string) => {
    if (draggedId.current && draggedId.current !== targetId) {
      reorderTasks(draggedId.current, targetId);
    }
    draggedId.current = null;
    setDropTarget(null);
  };

  return (
    <div>
      {/* Task Input */}
      <section className="mb-8 rounded-2xl border border-wb-border bg-wb-surface p-7">
        <div className="flex flex-col gap-2">
          <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Task
          </label>
          <input
            className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none transition-colors focus:border-wb-accent"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTask();
              }
            }}
            placeholder="What needs to get done?"
            ref={titleRef}
            type="text"
            value={title}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Notes (optional)
          </label>
          <textarea
            className="resize-y rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none transition-colors focus:border-wb-accent"
            onChange={(e) => setTaskNotes(e.target.value)}
            placeholder="Extra details, links, context..."
            rows={3}
            value={taskNotes}
          />
        </div>
        <button
          className="mt-4 w-full rounded-lg bg-wb-accent py-3.5 font-medium text-wb-bg transition-all hover:brightness-110"
          onClick={handleAddTask}
          type="button"
        >
          Add Task
        </button>
      </section>

      {/* Filter Bar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-wb-border bg-wb-surface p-1">
          {(['active', 'all', 'done'] as TaskFilter[]).map((f) => (
            <button
              className={`rounded-md px-4 py-[7px] text-[0.8rem] font-medium transition-all ${
                taskFilter === f
                  ? 'bg-wb-accent text-wb-bg'
                  : 'bg-transparent text-wb-text-muted hover:text-wb-text'
              }`}
              key={f}
              onClick={() => setTaskFilter(f)}
              type="button"
            >
              {f === 'active' ? 'Active' : f === 'all' ? 'All' : 'Completed'}
            </button>
          ))}
        </div>
        <div className="rounded-full border border-wb-border bg-wb-surface px-4 py-2 text-[0.875rem] text-wb-text-muted">
          <strong className="font-semibold text-wb-accent">{totalDone}</strong>{' '}
          / {tasks.length} done
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-1.5">
        {filteredTasks.length === 0 ? (
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
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <p>
              {taskFilter === 'done'
                ? 'No completed tasks yet'
                : taskFilter === 'active'
                  ? 'All caught up!'
                  : 'No tasks yet'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div className="relative" key={task.id}>
              {dropTarget?.id === task.id &&
                dropTarget.position === 'above' && (
                  <div className="absolute -top-[3px] left-4 right-4 z-10 h-[3px] rounded-full bg-wb-accent shadow-[0_0_8px_rgba(0,212,170,0.4)]" />
                )}
              <div
                className={`group grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 rounded-xl border border-wb-border bg-wb-surface px-5 py-4 transition-all hover:border-wb-accent hover:bg-wb-surface-hover ${
                  task.done ? 'opacity-60' : ''
                } ${draggedId.current === task.id ? 'opacity-30' : ''}`}
                data-task-id={task.id}
                draggable={!task.done && taskFilter !== 'done'}
                onDragEnd={() => {
                  draggedId.current = null;
                  setDropTarget(null);
                }}
                onDragLeave={() => {
                  setDropTarget((prev) => (prev?.id === task.id ? null : prev));
                }}
                onDragOver={(e) => {
                  if (!task.done) {
                    handleDragOver(e, task.id);
                  }
                }}
                onDragStart={() => handleDragStart(task.id)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!task.done) {
                    handleDrop(task.id);
                  }
                }}
              >
                {/* Drag Handle */}
                <div
                  className={`cursor-grab text-wb-border transition-colors active:cursor-grabbing ${task.done ? 'opacity-30' : 'hover:text-wb-text-muted'}`}
                >
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <circle cx="9" cy="6" r="1" />
                    <circle cx="15" cy="6" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="9" cy="18" r="1" />
                    <circle cx="15" cy="18" r="1" />
                  </svg>
                </div>

                {/* Checkbox */}
                <button
                  className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    task.done
                      ? 'border-wb-accent bg-wb-accent text-wb-bg'
                      : 'border-wb-border bg-transparent text-transparent hover:border-wb-accent'
                  }`}
                  onClick={() => handleToggle(task.id)}
                  type="button"
                >
                  <svg
                    fill="none"
                    height="12"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    width="12"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>

                {/* Content */}
                <div className="flex min-w-0 flex-col gap-1">
                  <div
                    className={`font-medium transition-all ${task.done ? 'text-wb-text-muted line-through' : ''}`}
                  >
                    {task.title}
                  </div>
                  {task.notes && (
                    <div
                      className={`whitespace-pre-wrap break-words text-[0.875rem] leading-relaxed text-wb-text-muted ${task.done ? 'opacity-50' : ''}`}
                    >
                      {task.notes}
                    </div>
                  )}
                  <div className="font-mono text-[0.7rem] text-wb-text-muted">
                    {task.done && task.completedAt ? (
                      <span className="text-wb-accent">
                        Completed {formatRelativeDate(task.completedAt)}
                      </span>
                    ) : (
                      <span>Added {formatRelativeDate(task.createdAt)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-accent hover:text-wb-accent"
                    onClick={() => {
                      setEditingId(task.id);
                      setEditTitle(task.title);
                      setEditNotes(task.notes || '');
                    }}
                    title="Edit"
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
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-danger hover:text-wb-danger"
                    onClick={() => setConfirmDelete(task.id)}
                    title="Delete"
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
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              {dropTarget?.id === task.id &&
                dropTarget.position === 'below' && (
                  <div className="absolute -bottom-[3px] left-4 right-4 z-10 h-[3px] rounded-full bg-wb-accent shadow-[0_0_8px_rgba(0,212,170,0.4)]" />
                )}
            </div>
          ))
        )}
      </div>

      {/* Celebration Animation */}
      {celebrating && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2">
          <div className="flex animate-celebration-pop flex-col items-center gap-3">
            <div className="confetti absolute h-2 w-2 rounded-sm" />
            <div className="confetti absolute h-2 w-2 rounded-sm" />
            <div className="confetti absolute h-2 w-2 rounded-sm" />
            <div className="confetti absolute h-2 w-2 rounded-sm" />
            <div className="confetti absolute h-2 w-2 rounded-sm" />
            <div className="confetti absolute h-2 w-2 rounded-sm" />
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-wb-accent shadow-[0_0_40px_rgba(0,212,170,0.5)]">
              <svg
                className="animate-check-draw"
                fill="none"
                height="36"
                stroke="#0a0a0b"
                strokeDasharray="50"
                strokeDashoffset="50"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="36"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-base font-semibold uppercase tracking-widest text-wb-accent">
              Done!
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <Modal
        className="w-full max-w-[480px]"
        isOpen={!!editingId}
        onClose={() => setEditingId(null)}
      >
        <h3 className="mb-6 font-medium">Edit Task</h3>
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Task
          </label>
          <input
            className="rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setEditTitle(e.target.value)}
            type="text"
            value={editTitle}
          />
        </div>
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-[0.75rem] uppercase tracking-widest text-wb-text-muted">
            Notes
          </label>
          <textarea
            className="resize-y rounded-lg border border-wb-border bg-wb-bg px-4 py-3.5 text-wb-text outline-none focus:border-wb-accent"
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
            value={editNotes}
          />
        </div>
        <div className="-mx-8 -mb-8 mt-6 flex justify-end gap-3 border-t border-wb-border px-8 py-4">
          <button
            className="rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted"
            onClick={() => setEditingId(null)}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-wb-accent px-5 py-2.5 text-[0.875rem] font-medium text-wb-bg"
            onClick={handleSaveEdit}
            type="button"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        danger
        isOpen={!!confirmDelete}
        message="Delete this task?"
        okText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteTask(confirmDelete);
          }
          setConfirmDelete(null);
        }}
        title="Delete Task"
      />
    </div>
  );
}
