import { cn } from '../../utils/cn';

/**
 * Honest empty state — never looks like populated data.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-12',
        className
      )}
      role="status"
    >
      {Icon && (
        <div
          className={cn(
            'mb-3 flex items-center justify-center rounded-lg border border-line bg-surface-subtle text-ink-faint',
            compact ? 'h-10 w-10' : 'h-12 w-12'
          )}
          aria-hidden
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.5} />
        </div>
      )}
      {title && (
        <p className="text-base font-medium text-ink-secondary">{title}</p>
      )}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-faint">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
