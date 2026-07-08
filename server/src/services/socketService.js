import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

// Map to store connected users and their socket IDs
// Key: userId, Value: socketId
const connectedUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Store user socket mapping
    connectedUsers.set(socket.user._id.toString(), socket.id);
    
    // Join a room specific to the user's role
    socket.join(socket.user.role);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
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
 * @param {String} userId - The recipient user ID
 * @param {String} eventName - The event name
 * @param {Object} payload - The data payload
 */
export const sendToUser = (userId, eventName, payload) => {
  if (!io) return;
  const socketId = connectedUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(eventName, payload);
  }
};

/**
 * Send a notification to all users with a specific role
 * @param {String} role - The role (e.g., 'admin', 'doctor', 'patient')
 * @param {String} eventName - The event name
 * @param {Object} payload - The data payload
 */
export const sendToRole = (role, eventName, payload) => {
  if (!io) return;
  io.to(role).emit(eventName, payload);
};
