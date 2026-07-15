import Modal from './Modal';
import { cn } from '../../utils/cn';

/**
 * Confirm / destructive action dialog.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} panelClassName="max-w-md">
      <div className="space-y-4 p-6">
        {description && (
          <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            className={cn('btn', danger ? 'btn-soft-danger' : 'btn-primary')}
            onClick={onConfirm}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
