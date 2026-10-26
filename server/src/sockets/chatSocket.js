import { generateNickname } from '../../../shared/nicknameGenerator.js';
import * as roomService from '../services/roomService.js';
import * as messageService from '../services/messageService.js';
import { checkRateLimit, clearRateLimit, getClientIp } from '../utils/rateLimiter.js';

export const MAX_ROOM_ID_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 500;

export function normalizeRoomId(roomId) {
  if (typeof roomId !== 'string') return null;
  const normalized = roomId.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_ROOM_ID_LENGTH) return null;
  return normalized;
}

function guard(socket, event, handler) {
  socket.on(event, (...args) => {
    try {
      handler(...args);
    } catch (err) {
      console.error(`socket ${event} failed:`, err);
    }
  });
}

function attachSocket(io, socket, db) {
  let currentRoom = null;
  const nickname = generateNickname();
  const clientIp = getClientIp(socket);

  socket.emit('nickname_assigned', nickname);

  guard(socket, 'join_room', (roomId) => {
    const normalized = normalizeRoomId(roomId);
    if (!normalized) return;

    if (currentRoom) {
      socket.leave(currentRoom);
      const leftUser = roomService.removeUserFromRoom(currentRoom, socket.id);
      if (leftUser) {
        io.to(currentRoom).emit('user_left', leftUser.nickname);
        io.to(currentRoom).emit('room_users', roomService.getRoomUsers(currentRoom));
      }
    }

    currentRoom = normalized;
    socket.join(normalized);
    roomService.addUserToRoom(normalized, socket.id, nickname);

    let history = [];
    if (db) {
      try {
        history = messageService.getMessageHistory(db, normalized);
      } catch (err) {
        console.error('Failed to load message history:', err);
      }
    }

    socket.emit('room_joined', {
      roomId: normalized,
      nickname,
      users: roomService.getRoomUsers(normalized),
      messages: history
    });

    socket.to(normalized).emit('user_joined', nickname);
    io.to(normalized).emit('room_users', roomService.getRoomUsers(normalized));
  });

  guard(socket, 'send_message', (data) => {
    if (!data || typeof data !== 'object') return;
    const roomId = normalizeRoomId(data.roomId);
    if (!roomId) return;
    if (typeof data.message !== 'string') return;

    const text = data.message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text) return;

    const userNickname = roomService.getUserNickname(roomId, socket.id);
    if (!userNickname) return;

    if (!checkRateLimit(clientIp)) {
      socket.emit('rate_limited', 'You are sending messages too fast. Please slow down.');
      return;
    }

    const msg = {
      nickname: userNickname,
      message: text,
      timestamp: new Date().toISOString()
    };

    if (db) {
      try {
        messageService.saveMessage(db, roomId, msg.nickname, msg.message);
      } catch (err) {
        console.error('Failed to save message:', err);
      }
    }

    io.to(roomId).emit('new_message', msg);
  });

  guard(socket, 'typing', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const roomId = normalizeRoomId(payload.roomId);
    if (!roomId) return;
    if (typeof payload.isTyping !== 'boolean') return;

    const userNickname = roomService.getUserNickname(roomId, socket.id);
    if (!userNickname) return;

    socket.to(roomId).emit('typing_update', {
      nickname: userNickname,
      isTyping: payload.isTyping
    });
  });

  guard(socket, 'disconnect', () => {
    clearRateLimit(clientIp);
    if (!currentRoom) return;
    const roomId = currentRoom;
    currentRoom = null;
    const leftUser = roomService.removeUserFromRoom(roomId, socket.id);
    if (!leftUser) return;
    io.to(roomId).emit('user_left', leftUser.nickname);
    io.to(roomId).emit('room_users', roomService.getRoomUsers(roomId));
  });
}

export function setupChatSocket(io, db) {
  io.on('connection', (socket) => {
    try {
      attachSocket(io, socket, db);
    } catch (err) {
      console.error('socket connection setup failed:', err);
    }
  });
}
