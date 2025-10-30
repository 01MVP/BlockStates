import { useEffect } from 'react';
import clsx from 'classnames';

type ToastType = 'info' | 'success' | 'warning' | 'error';

const toneClasses: Record<ToastType, string> = {
  info: 'border-text-primary bg-white text-text-primary',
  success: 'border-green-500 bg-green-50 text-green-700',
  warning: 'border-amber-500 bg-amber-50 text-amber-700',
  error: 'border-red-500 bg-red-50 text-red-700',
};

interface ToastProps {
  open: boolean;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number | null;
  onClose?: () => void;
}

export default function Toast({
  open,
  message,
  title,
  type = 'info',
  duration = 2000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open || !onClose || duration === null) return;
    const timer = window.setTimeout(onClose, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open, onClose, duration]);

  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-tooltip flex justify-center px-4 sm:px-0">
      <div
        className={clsx(
          'pointer-events-auto w-full max-w-md rounded-lg border-2 px-4 py-3 shadow-lg',
          toneClasses[type],
        )}
      >
        {title && <div className="text-sm font-medium">{title}</div>}
        <div className="mt-1 text-sm leading-5">{message}</div>
      </div>
    </div>
  );
}
