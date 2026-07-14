import { cn } from '../../utils/cn';

/**
 * Shared tabs — underline (default) or segmented.
 */
export default function Tabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
  className,
  'aria-label': ariaLabel = 'Sections',
}) {
  if (variant === 'segmented') {
    return (
      <div className={cn('tabs-bar', className)} role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const id = typeof tab === 'string' ? tab : tab.id;
          const label = typeof tab === 'string' ? tab : tab.label;
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn('tab-btn', active && 'tab-btn-active')}
              onClick={() => onChange(id)}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('tabs-underline', className)} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id;
        const label = typeof tab === 'string' ? tab : tab.label;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn('tab-underline', active && 'tab-underline-active')}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
