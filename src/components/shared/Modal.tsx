import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ children, className = '', isOpen, onClose }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('scroll-locked');
    } else {
      document.documentElement.classList.remove('scroll-locked');
    }

    return () => {
      document.documentElement.classList.remove('scroll-locked');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={handleOverlayClick}
      ref={overlayRef}
    >
      <div
        className={`relative rounded-2xl border border-wb-border bg-wb-surface p-8 ${className}`}
      >
        <button
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-wb-border bg-wb-bg text-wb-text-muted transition-all hover:border-wb-text-muted hover:text-wb-text"
          onClick={onClose}
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
        {children}
      </div>
    </div>
  );
}
