import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

/**
 * Socket.IO origin:
 * - VITE_SOCKET_URL if set
 * - Same origin when using relative API (dev proxy / production nginx)
 * - Derived from absolute VITE_API_URL otherwise
 */
function socketOrigin() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const api = import.meta.env.VITE_API_URL;
  if (!api || api.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  try {
    return new URL(api).origin;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let newSocket;

    if (user) {
      newSocket = io(socketOrigin(), {
        withCredentials: true, // send httpOnly accessToken cookie
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        if (import.meta.env.DEV) console.log('Socket connected');
      });

      newSocket.on('connect_error', (err) => {
        if (import.meta.env.DEV) console.error('Socket connection error:', err.message);
      });

      newSocket.on('notification', (data) => {
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) newSocket.disconnect();
      setSocket(null);
    };
  }, [user?._id]);

  const markAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{ socket, notifications, unreadCount, markAsRead, clearNotifications }}
    >
      {children}
    </SocketContext.Provider>
  );
};
