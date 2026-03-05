import { useCallback, useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  cancelText?: string;
  danger?: boolean;
  isOpen: boolean;
  message: string;
  okText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({
  cancelText = 'Cancel',
  danger = false,
  isOpen,
  message,
  okText = 'Confirm',
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80"
      onClick={handleOverlayClick}
      ref={overlayRef}
    >
      <div className="w-full max-w-[400px] rounded-2xl border border-wb-border bg-wb-surface p-7 text-center">
        <h4 className="mb-2 font-medium">{title}</h4>
        <p className="mb-6 text-[0.9rem] leading-relaxed text-wb-text-muted">
          {message}
        </p>
        <div className="flex justify-center gap-3">
          <button
            className="min-w-[100px] rounded-lg border border-wb-border bg-transparent px-5 py-2.5 text-[0.875rem] font-medium text-wb-text-muted transition-all hover:bg-wb-surface hover:text-wb-text"
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`min-w-[100px] rounded-lg border px-5 py-2.5 text-[0.875rem] font-medium transition-all ${
              danger
                ? 'border-red-500 bg-transparent text-red-400 hover:bg-red-500/10'
                : 'border-transparent bg-wb-accent text-wb-bg hover:brightness-110'
            }`}
            onClick={onConfirm}
            type="button"
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}
