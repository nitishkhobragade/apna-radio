import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  text: string;
}

interface ErrorToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      onDismiss(toasts[toasts.length - 1].id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  // Only display the single latest toast to prevent screen-blocking clutter
  const latestToast = toasts[toasts.length - 1];
  const isError = latestToast.type === 'error';
  const isSuccess = latestToast.type === 'success';

  return (
    <div className="fixed bottom-10 sm:bottom-12 right-3 sm:right-5 z-50 max-w-[280px] sm:max-w-xs w-full select-none pointer-events-none">
      <div
        key={latestToast.id}
        className={`pointer-events-auto rounded-lg p-2.5 border shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-300 ${
          isError
            ? 'bg-[#2b1411]/95 border-[#d9534f] text-[#ffdad4]'
            : isSuccess
            ? 'bg-[#152617]/95 border-[#48bb78] text-[#d4f8de]'
            : 'bg-[#261910]/95 border-[#d97706] text-[#faedd4]'
        }`}
      >
        <div className="shrink-0">
          {isError && <AlertTriangle className="w-4 h-4 text-[#ff6b6b]" />}
          {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#48bb78]" />}
          {!isError && !isSuccess && <Info className="w-4 h-4 text-[#f59e0b]" />}
        </div>

        <div className="flex-1 text-[11px] sm:text-xs font-sans leading-snug line-clamp-2">
          {latestToast.text}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(latestToast.id)}
          className="p-1 rounded text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
