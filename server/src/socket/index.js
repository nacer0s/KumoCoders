import { Server } from 'socket.io';

let io = null;

// In-memory presence store
const connectedUsers = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('presence:join', ({ userId, username, displayName, avatarUrl, teamId, currentApp }) => {
      connectedUsers.set(socket.id, { userId, username, displayName, avatarUrl, teamId, currentApp });
      socket.join(`team:${teamId}`);
      socket.join(`user:${userId}`);
      io.to(`team:${teamId}`).emit('presence:update', { online: getOnlineUsers(teamId) });
    });

    socket.on('join:app', (appName) => {
      socket.join(`app:${appName}`);
    });

    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });

    // ─── Whiteboard real-time ───

    socket.on('whiteboard:join', ({ boardId, user }) => {
      const room = `whiteboard:${boardId}`;
      socket.join(room);
      socket.data.wbBoardId = boardId;
      socket.data.wbUser = user;
      socket.to(room).emit('whiteboard:user:joined', { userId: user.id, user });
      console.log(`[Socket] ${socket.id} (${user.display_name || user.username}) joined ${room}`);
    });

    socket.on('whiteboard:leave', ({ boardId }) => {
      const room = `whiteboard:${boardId}`;
      socket.leave(room);
      const user = socket.data.wbUser;
      if (user) {
        socket.to(room).emit('whiteboard:user:left', { userId: user.id });
      }
      socket.data.wbBoardId = null;
      socket.data.wbUser = null;
    });

    socket.on('whiteboard:element:add', ({ boardId, element }) => {
      socket.to(`whiteboard:${boardId}`).emit('whiteboard:element:add', { element, userId: socket.data.wbUser?.id });
    });

    socket.on('whiteboard:element:update', ({ boardId, elementId, changes }) => {
      socket.to(`whiteboard:${boardId}`).emit('whiteboard:element:update', { elementId, changes, userId: socket.data.wbUser?.id });
    });

    socket.on('whiteboard:element:delete', ({ boardId, elementId }) => {
      socket.to(`whiteboard:${boardId}`).emit('whiteboard:element:delete', { elementId, userId: socket.data.wbUser?.id });
    });

    socket.on('whiteboard:clear', ({ boardId }) => {
      socket.to(`whiteboard:${boardId}`).emit('whiteboard:clear', { userId: socket.data.wbUser?.id });
    });

    socket.on('whiteboard:sync', ({ boardId, elements }) => {
      socket.to(`whiteboard:${boardId}`).emit('whiteboard:sync', { elements, userId: socket.data.wbUser?.id });
    });

    socket.on('whiteboard:cursor:move', ({ boardId, position }) => {
      const user = socket.data.wbUser;
      if (!user) return;
      socket.to(`whiteboard:${boardId}`).emit('whiteboard:cursor:move', {
        userId: user.id,
        user: { id: user.id, display_name: user.display_name, username: user.username, avatar_url: user.avatar_url },
        position,
      });
    });

    socket.on('disconnect', () => {
      const user = socket.data.wbUser;
      const boardId = socket.data.wbBoardId;
      if (boardId && user) {
        socket.to(`whiteboard:${boardId}`).emit('whiteboard:user:left', { userId: user.id });
      }

      const presence = connectedUsers.get(socket.id);
      if (presence) {
        connectedUsers.delete(socket.id);
        io.to(`team:${presence.teamId}`).emit('presence:update', { online: getOnlineUsers(presence.teamId) });
      }
    });
  });

  console.log('[Socket] Socket.IO initialized');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
}

export function getOnlineUsers(teamId) {
  const users = [];
  for (const [, data] of connectedUsers) {
    if (data.teamId === teamId) {
      users.push(data);
    }
  }
  return users;
}

export function getOnlineUsersInApp(teamId, appKey) {
  const users = [];
  for (const [, data] of connectedUsers) {
    if (data.teamId === teamId && data.currentApp === appKey) {
      users.push(data);
    }
  }
  return users;
}
