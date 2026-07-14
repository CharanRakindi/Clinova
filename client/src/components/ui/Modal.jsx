import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Shared modal with focus restore and Escape to close.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  panelClassName,
  wide = false,
}) {
  const titleId = useId();
  const closeRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    const t = window.setTimeout(() => closeRef.current?.focus(), 10);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn('modal-backdrop', className)}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn('modal-panel', wide && 'max-w-2xl', panelClassName)}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            {title ? (
              <h2 id={titleId} className="text-base font-medium text-ink">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {onClose && (
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="tap-target inline-flex items-center justify-center rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
