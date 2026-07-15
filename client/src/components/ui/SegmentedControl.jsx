import { cn } from '../../utils/cn';

/**
 * Compact segmented control (list/calendar toggles, filter strips).
 * Uses the same tabs-bar language as Tabs — one interaction model.
 */
export default function SegmentedControl({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel = 'View options',
  size = 'md',
}) {
  return (
    <div
      className={cn('tabs-bar w-auto shrink-0', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const id = opt.id ?? opt.value;
        const active = value === id;
        const Icon = opt.icon;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={opt.label || String(id)}
            title={opt.label}
            className={cn(
              'tab-btn flex-none',
              size === 'sm' ? 'px-2 py-1.5' : 'px-2.5 py-2',
              active && 'tab-btn-active'
            )}
            onClick={() => onChange(id)}
          >
            {Icon ? <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden /> : opt.label}
            {Icon && opt.showLabel ? (
              <span className="ml-1.5">{opt.label}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
