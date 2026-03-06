import { useApp } from '@/contexts/AppContext';

export function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          className={`max-w-[360px] animate-toast-in rounded-[10px] border bg-wb-surface px-5 py-3 text-[0.85rem] shadow-lg shadow-black/40 ${
            toast.type === 'error'
              ? 'border-wb-danger text-wb-danger'
              : toast.type === 'success'
                ? 'border-wb-accent text-wb-accent'
                : 'border-wb-border text-wb-text'
          }`}
          key={toast.id}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
