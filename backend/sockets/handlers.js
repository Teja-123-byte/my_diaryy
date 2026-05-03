const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const { rooms, userRooms, userById } = require('../utils/state');
const { pushToUser, handleLeave } = require('../utils/socket-utils');

function registerSocketHandlers(io, socket) {
  console.log(`🔌 Connected: ${socket.id}`);

  // ── User registration ──
  socket.on('register-user', ({ userId }) => {
    if (!userId) return;
    socket.data.userId = userId;
    if (!userById.has(userId)) userById.set(userId, new Set());
    userById.get(userId).add(socket.id);
  });

  // ── Rooms ──
  socket.on('create-room', ({ username }) => {
    const roomId = uuidv4().slice(0, 8);
    rooms.set(roomId, new Map());
    socket.emit('room-created', { roomId });
    console.log(`📌 Room created: ${roomId} by ${username}`);
  });

  socket.on('join-room', ({ roomId, username }) => {
    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    const room = rooms.get(roomId);
    socket.join(roomId);
    userRooms.set(socket.id, roomId);

    const existingUsers = Array.from(room.entries()).map(([id, name]) => ({
      socketId: id,
      username: name,
    }));
    socket.emit('all-users', existingUsers);
    socket.to(roomId).emit('user-joined', { socketId: socket.id, username });
    room.set(socket.id, username);
    console.log(`👥 ${username} joined ${roomId} (total ${room.size})`);
  });

  // ── Chat ──
  socket.on('chat-message', ({ roomId, message, username }) => {
    if (!rooms.has(roomId)) return;
    io.to(roomId).emit('chat-message', {
      username,
      message,
      timestamp: Date.now(),
      socketId: socket.id,
    });
  });

  // ── WebRTC signaling ──
  socket.on('offer', ({ targetSocketId, offer }) => {
    io.to(targetSocketId).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ── Tasks: create / update / delete ──
  socket.on('create-task', async ({ userId, roomId, title, category, emoji, reminderAt }) => {
    try {
      const task = await Task.create({ userId, roomId, title, category, emoji, reminderAt });
      const payload = {
        taskId: task._id.toString(),
        userId,
        roomId,
        title,
        category,
        emoji,
        reminderAt: task.reminderAt,
        completed: false,
      };
      if (roomId) io.to(roomId).emit('new-task', payload);
      pushToUser(io, userId, 'new-task', payload);
    } catch (err) {
      console.error('create-task:', err);
    }
  });

  socket.on('update-task', async ({ taskId, completed, title, reminderAt, category, emoji }) => {
    try {
      const update = {};
      if (completed !== undefined) update.completed = completed;
      if (title !== undefined) update.title = title;
      if (reminderAt !== undefined) {
        update.reminderAt = reminderAt;
        update.reminded = false;
      }
      if (category !== undefined) update.category = category;
      if (emoji !== undefined) update.emoji = emoji;

      const task = await Task.findByIdAndUpdate(taskId, update, { new: true });
      if (!task) return;

      const payload = { taskId: task._id.toString(), ...update };
      if (task.roomId) io.to(task.roomId).emit('task-updated', payload);
      pushToUser(io, task.userId, 'task-updated', payload);
    } catch (err) {
      console.error('update-task:', err);
    }
  });

  socket.on('delete-task', async ({ taskId }) => {
    try {
      const task = await Task.findByIdAndDelete(taskId);
      if (!task) return;

      const payload = { taskId };
      if (task.roomId) io.to(task.roomId).emit('task-deleted', payload);
      pushToUser(io, task.userId, 'task-deleted', payload);
    } catch (err) {
      console.error('delete-task:', err);
    }
  });

  // ── Leave / disconnect ──
  socket.on('leave-room', () => handleLeave(io, socket));
  socket.on('disconnect', () => {
    handleLeave(io, socket);
    const uid = socket.data.userId;
    if (uid && userById.has(uid)) {
      userById.get(uid).delete(socket.id);
      if (userById.get(uid).size === 0) userById.delete(uid);
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
}

module.exports = { registerSocketHandlers };
