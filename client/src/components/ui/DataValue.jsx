import { cn } from '../../utils/cn';

/**
 * Renders clinical/user data honestly.
 * Missing values use muted italic "not documented" — never fabricated placeholders.
 */
export default function DataValue({
  value,
  empty = 'Not documented',
  className,
  emptyClassName,
  as: Tag = 'span',
}) {
  const isEmpty =
    value == null ||
    value === '' ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return (
      <Tag className={cn('data-empty', emptyClassName, className)}>{empty}</Tag>
    );
  }

  return <Tag className={cn('data-value', className)}>{value}</Tag>;
}
