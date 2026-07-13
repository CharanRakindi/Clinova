import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

function socketOrigin() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
  // Strip /api/v1 (or trailing path) so we connect to the Socket.IO server origin
  try {
    const u = new URL(api);
    return u.origin;
  } catch {
    return 'http://localhost:5001';
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
