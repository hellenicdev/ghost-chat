const rooms = new Map();

export function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

export function addUserToRoom(roomId, socketId, nickname) {
  const room = getOrCreateRoom(roomId);
  room.set(socketId, { nickname, joinedAt: Date.now() });
}

export function removeUserFromRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const user = room.get(socketId);
  room.delete(socketId);
  if (room.size === 0) {
    rooms.delete(roomId);
  }
  return user;
}

export function getUserNickname(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const user = room.get(socketId);
  return user ? user.nickname : null;
}

export function getRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.values()).map(u => u.nickname);
}

export function getRoomCount(roomId) {
  const room = rooms.get(roomId);
  return room ? room.size : 0;
}
