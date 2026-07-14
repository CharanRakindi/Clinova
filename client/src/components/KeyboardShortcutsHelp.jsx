import { useState, useEffect } from 'react';
import { Command, X } from 'lucide-react';

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle palette on Ctrl+/ or '?' (if not typing in input)
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

  if (!isOpen) return null;

  const shortcuts = [
    { key: "⌘ K / Ctrl K", desc: "Open Command Palette / Search" },
    { key: "? / Ctrl /", desc: "Show / Hide Keyboard Shortcuts Help" },
    { key: "Esc", desc: "Close dialog or overlays" },
    { key: "⌥ D", desc: "Go to Dashboard" },
    { key: "⌥ P", desc: "Go to Patients Directory" },
    { key: "⌥ A", desc: "Go to Appointments" },
    { key: "⌥ R", desc: "Go to Medical Records" },
    { key: "⌥ S", desc: "Go to Profile / Settings" }
  ];

  return (
    <div className="modal-backdrop z-[120]">
      <div className="modal-panel relative max-w-md p-6">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600">
            <Command className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-md font-medium leading-none text-slate-900">
              Keyboard shortcuts
            </h3>
            <p className="mt-1.5 text-xs font-normal text-slate-400">
              Move faster through your workspace
            </p>
          </div>
        </div>

        <div className="mb-2 space-y-3">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="font-normal text-slate-600">{s.desc}</span>
              <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-2xs text-slate-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
