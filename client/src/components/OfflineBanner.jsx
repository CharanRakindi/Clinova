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
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm animate-slide-in-right rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-premium-lg">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-rose-500/10 p-2 text-rose-400">
          <WifiOff className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">You&apos;re offline</h4>
          <p className="mt-1 text-xs font-normal text-white/55">
            Clinova will sync your updates once connectivity is restored.
          </p>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          className="text-slate-500 hover:text-slate-300 p-0.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
