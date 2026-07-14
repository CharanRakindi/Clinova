import { useState, useEffect } from 'react';
import { Command } from 'lucide-react';
import Modal from './ui/Modal';

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === '/' && e.ctrlKey) ||
        (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))
      ) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { key: '⌘ K / Ctrl K', desc: 'Open command palette / search' },
    { key: '? / Ctrl /', desc: 'Show / hide keyboard shortcuts' },
    { key: 'Esc', desc: 'Close dialog or overlays' },
    { key: '⌥ D', desc: 'Go to dashboard' },
    { key: '⌥ P', desc: 'Go to patients directory' },
    { key: '⌥ A', desc: 'Go to appointments' },
    { key: '⌥ R', desc: 'Go to medical records' },
    { key: '⌥ S', desc: 'Go to profile / settings' },
  ];

  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Keyboard shortcuts"
      className="z-[120]"
      panelClassName="max-w-md"
    >
      <div className="px-6 pb-6 pt-2">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg border border-line bg-surface-subtle p-2 text-ink-muted">
            <Command className="h-4 w-4" aria-hidden />
          </div>
          <p className="text-xs text-ink-faint">Move faster through your workspace</p>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-normal text-ink-muted">{s.desc}</span>
              <kbd className="shrink-0 rounded-lg border border-line bg-surface-subtle px-2.5 py-1 font-mono text-2xs text-ink-secondary">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
