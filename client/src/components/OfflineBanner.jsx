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
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 animate-slide-in-right">
      <div className="flex items-start gap-3">
        <div className="bg-rose-500/10 p-2 rounded-xl text-rose-500 shrink-0">
          <WifiOff className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold">Offline Connection</h4>
          <p className="text-xs font-medium text-slate-400 mt-1">
            You are currently offline. Clinova will sync your updates once connectivity is restored.
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
