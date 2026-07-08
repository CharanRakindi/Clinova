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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden transform animate-scale-in">
        <button 
          onClick={() => setIsOpen(false)} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary-50 p-2 rounded-xl text-primary-500">
            <Command className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 leading-none">Keyboard Shortcuts</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Accelerate your clinical workflow</p>
          </div>
        </div>

        <div className="space-y-3.5 mb-2">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-600">{s.desc}</span>
              <kbd className="px-2.5 py-1 text-[11px] font-mono bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
