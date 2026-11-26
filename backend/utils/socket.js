const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

/**
 * Initialize Socket.IO server with JWT authentication and private user rooms.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Authenticate socket connection using JWT access token
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('_id name role isActive');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: user invalid or inactive'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      };
      next();
    } catch (error) {
      next(new Error('Authentication error: invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);

    // Explicitly block any attempt to subscribe to another user's private room
    socket.on('joinRoom', (requestedRoom) => {
      if (requestedRoom !== userRoom) {
        socket.emit('errorMessage', {
          message: 'Forbidden: cannot subscribe to another user room',
        });
        return;
      }
      socket.join(userRoom);
    });

    socket.on('disconnect', () => {
      // Socket automatically leaves rooms on disconnect
    });
  });

  return io;
};

/**
 * Emit a real-time event to a specific user's private room.
 */
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, getIO };
