import { ReactNode, useEffect, useId } from 'react';
import clsx from 'classnames';

type ModalSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
  hideCloseButton?: boolean;
  disableBackdropClose?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  hideCloseButton = false,
  disableBackdropClose = false,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const sizeClass = sizeMap[size] ?? sizeMap.md;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className="fixed inset-0 z-modal flex items-center justify-center px-4 py-6 sm:px-6"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!disableBackdropClose) {
            onClose();
          }
        }}
      />
      <div
        className={clsx(
          'relative w-full rounded-lg border-2 border-border-main bg-white shadow-xl',
          'max-h-[90vh] overflow-y-auto',
          'px-6 py-5',
          sizeClass,
          className,
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {(title || !hideCloseButton) && (
          <div className="mb-4 flex items-start justify-between gap-6">
            {title ? (
              <h2
                id={titleId}
                className="text-lg font-medium text-text-primary"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="icon-btn text-text-muted"
                aria-label="关闭对话框"
              >
                <span aria-hidden className="text-base font-medium leading-none">
                  ×
                </span>
              </button>
            )}
          </div>
        )}

        {description && (
          <p id={descriptionId} className="mb-4 text-sm text-text-muted">
            {description}
          </p>
        )}

        <div className="space-y-4">{children}</div>

        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
