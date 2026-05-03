// ───── In-memory state management ─────
const rooms = new Map();      // roomId → Map<socketId, username>
const userRooms = new Map();  // socketId → roomId
const userById = new Map();   // userId → Set<socketId>  (for direct reminder push)

module.exports = {
  rooms,
  userRooms,
  userById,
};
