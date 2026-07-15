import { useState, useRef, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { cn } from '../utils/cn';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, clearNotifications } = useSocket();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markAsRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell"
        type="button"
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-ink-faint transition-colors duration-product hover:bg-surface-subtle hover:text-ink-secondary"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell className="h-4.5 w-4.5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-danger ring-2 ring-surface"
            aria-hidden
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-line bg-surface shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-line-soft bg-surface-subtle/60 px-4 py-3">
            <h3 className="text-sm font-medium text-ink">Notifications</h3>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="flex items-center gap-1 text-xs text-ink-muted transition-colors duration-product hover:text-danger"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-ink-muted flex flex-col items-center">
                <Bell className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "p-4 transition-colors hover:bg-surface-subtle",
                      !notification.read && "bg-surface-subtle/30"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-ink">
                          <Bell className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-ink-secondary">{notification.message}</p>
                        <p className="text-xs text-ink-muted mt-1">
                          {new Date(notification.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
