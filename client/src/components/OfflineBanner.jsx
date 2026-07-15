import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const goOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[100] w-full max-w-sm animate-slide-in-right rounded-xl border border-white/10 bg-surface-inverse p-4 text-ink-inverse shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-danger/15 p-2 text-danger-border">
          <WifiOff className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium">You&apos;re offline</h4>
          <p className="mt-1 text-xs font-normal text-white/55">
            Clinova will sync your updates once connectivity is restored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 text-white/50 transition-colors duration-product hover:bg-white/10 hover:text-white"
          aria-label="Dismiss offline notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
