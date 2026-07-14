import { ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Clinical / system alert — visual weight matches severity.
 */
export default function AlertBanner({
  title,
  children,
  severity = 'critical',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-start gap-2.5 rounded-lg border px-4 py-3',
        severity === 'critical' && 'border-danger-border bg-danger-soft text-danger',
        severity === 'warning' && 'border-warning-border bg-warning-soft text-warning',
        severity === 'info' && 'border-info-border bg-info-soft text-info',
        className
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-sm font-medium leading-snug">{title}</p>
        )}
        {children && (
          <div className={cn('text-sm', title && 'mt-1.5')}>{children}</div>
        )}
      </div>
    </div>
  );
}
