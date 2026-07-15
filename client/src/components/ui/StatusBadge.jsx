import { cn } from '../../utils/cn';

const TONE_CLASS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

/**
 * Single domain → tone map. Appointment, lab, record, audit, and severity
 * statuses must never invent their own border+fill stacks per page.
 */
const STATUS_TONE = {
  // appointments / records
  confirmed: 'success',
  completed: 'success',
  active: 'success',
  Active: 'success',
  reviewed: 'success',
  Resolved: 'success',
  requested: 'warning',
  ordered: 'warning',
  processing: 'info',
  sample_collected: 'info',
  cancelled: 'danger',
  // allergy severity
  Severe: 'danger',
  Moderate: 'warning',
  Mild: 'neutral',
  Unknown: 'neutral',
  // audit actions
  CREATE: 'success',
  LOGIN: 'info',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGOUT: 'neutral',
};

export function statusTone(status) {
  if (status == null || status === '') return 'neutral';
  if (STATUS_TONE[status]) return STATUS_TONE[status];
  const lower = String(status).toLowerCase();
  if (STATUS_TONE[lower]) return STATUS_TONE[lower];
  return 'neutral';
}

/**
 * Flat status chip — fill only, no border+shadow stacking.
 * Prefer this over ad-hoc emerald/amber/rose spans.
 */
export default function StatusBadge({
  status,
  children,
  className,
  tone: toneProp,
  /** When true, keep original casing (e.g. CREATE) */
  preserveCase = false,
}) {
  const tone = toneProp || statusTone(status);
  const raw =
    children != null
      ? children
      : status != null
        ? String(status).replace(/_/g, ' ')
        : '';

  return (
    <span
      className={cn(
        'badge',
        !preserveCase && 'capitalize',
        TONE_CLASS[tone] || TONE_CLASS.neutral,
        className
      )}
    >
      {raw}
    </span>
  );
}
