import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

// Map to store connected users and their socket IDs
// Key: userId, Value: socketId
const connectedUsers = new Map();

function parseCookie(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v.join('=') || '');
    return acc;
  }, {});
}

export const initSocket = (server) => {
  const allowed = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowed.length === 1 ? allowed[0] : allowed,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware — cookie or handshake auth token
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = parseCookie(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        return next(new Error('Authentication error: Server misconfigured'));
      }

      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);

    connectedUsers.set(socket.user._id.toString(), socket.id);
    socket.join(socket.user.role);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
      connectedUsers.delete(socket.user._id.toString());
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Send a notification to a specific user
 */
export const sendToUser = (userId, eventName, payload) => {
  if (!io || !userId) return;
  const socketId = connectedUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(eventName, payload);
  }
};

/**
 * Send a notification to all users with a specific role
 */
export const sendToRole = (role, eventName, payload) => {
  if (!io) return;
  io.to(role).emit(eventName, payload);
};
