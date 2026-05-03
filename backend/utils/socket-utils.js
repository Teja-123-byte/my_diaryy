const { userById, rooms, userRooms } = require('./state');

function pushToUser(io, userId, event, payload) {
  if (!userId || !userById.has(userId)) return;
  for (const sid of userById.get(userId)) io.to(sid).emit(event, payload);
}

function handleLeave(io, socket) {
  const roomId = userRooms.get(socket.id);
  if (!roomId || !rooms.has(roomId)) return;
  const room = rooms.get(roomId);
  const username = room.get(socket.id) || 'Someone';
  room.delete(socket.id);
  userRooms.delete(socket.id);
  socket.to(roomId).emit('user-left', { socketId: socket.id, username });
  socket.leave(roomId);
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑️ Room ${roomId} deleted (empty)`);
  }
}

module.exports = {
  pushToUser,
  handleLeave,
};
