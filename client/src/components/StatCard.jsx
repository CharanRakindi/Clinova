import { cn } from '../utils/cn';
import AnimatedCounter from './AnimatedCounter';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Metric card — one elevation, muted icon, clear hierarchy:
 * label (quiet) → value (loud) → context (quiet) → optional action.
 * No competing decorative chrome.
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  contextText,
  actionText,
  actionHref,
  trend,
  trendType = 'neutral',
  className,
  /** Emphasize this card as the focal metric on a row */
  emphasis = false,
}) => {
  const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
  const displayContext = contextText || description;

  const ActionTag = actionHref?.startsWith('/') ? Link : 'a';
  const actionProps = actionHref?.startsWith('/')
    ? { to: actionHref }
    : { href: actionHref };

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border bg-surface p-5 transition-[border-color,box-shadow] duration-product ease-product',
        emphasis
          ? 'border-ink/15 shadow-md ring-1 ring-ink/5'
          : 'border-line-soft shadow-sm hover:border-line hover:shadow-md',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="ui-label">{title}</h3>
          {Icon && (
            <Icon
              className="h-4 w-4 shrink-0 text-ink-faint"
              strokeWidth={1.75}
              aria-hidden
            />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span
            className={cn(
              'font-medium tracking-tight text-ink',
              emphasis ? 'text-3xl' : 'text-2xl'
            )}
          >
            {isNumeric ? <AnimatedCounter value={value} /> : value}
          </span>
          {trend != null && trend !== '' && (
            <span
              className={cn(
                'badge',
                trendType === 'positive' && 'badge-success',
                trendType === 'negative' && 'badge-danger',
                trendType === 'neutral' && 'badge-neutral'
              )}
            >
              {trend}
            </span>
          )}
        </div>

        {displayContext && (
          <p className="mt-1.5 text-xs leading-snug text-ink-muted">{displayContext}</p>
        )}
      </div>

      {actionText && actionHref && (
        <ActionTag
          {...actionProps}
          className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs font-medium text-ink-muted transition-colors duration-product hover:text-ink"
        >
          <span>{actionText}</span>
          <ChevronRight
            className="h-3.5 w-3.5 text-ink-faint transition-transform duration-product ease-product group-hover:translate-x-0.5"
            aria-hidden
          />
        </ActionTag>
      )}
    </div>
  );
};

export default StatCard;
