import { generateNickname } from '../../../shared/nicknameGenerator.js';
import * as roomService from '../services/roomService.js';
import * as messageService from '../services/messageService.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

export function setupChatSocket(io, db) {
  io.on('connection', (socket) => {
    let currentRoom = null;
    let nickname = generateNickname();

    socket.emit('nickname_assigned', nickname);

    socket.on('join_room', (roomId) => {
      if (!roomId || typeof roomId !== 'string') return;
      roomId = roomId.trim().toLowerCase();
      if (!roomId) return;

      if (currentRoom) {
        socket.leave(currentRoom);
        const leftUser = roomService.removeUserFromRoom(currentRoom, socket.id);
        if (leftUser) {
          io.to(currentRoom).emit('user_left', leftUser.nickname);
          io.to(currentRoom).emit('room_users', roomService.getRoomUsers(currentRoom));
        }
      }

      currentRoom = roomId;
      socket.join(roomId);
      roomService.addUserToRoom(roomId, socket.id, nickname);

      const history = db ? messageService.getMessageHistory(db, roomId) : [];

      socket.emit('room_joined', {
        roomId,
        nickname,
        users: roomService.getRoomUsers(roomId),
        messages: history
      });

      socket.to(roomId).emit('user_joined', nickname);
      io.to(roomId).emit('room_users', roomService.getRoomUsers(roomId));
    });

    socket.on('send_message', (data) => {
      if (!data || !data.roomId || !data.message) return;
      if (!checkRateLimit(socket.id)) {
        socket.emit('rate_limited', 'You are sending messages too fast. Please slow down.');
        return;
      }

      const { roomId, message } = data;
      const userNickname = roomService.getUserNickname(roomId, socket.id);
      if (!userNickname) return;

      const msg = {
        nickname: userNickname,
        message: message.trim().slice(0, 500),
        timestamp: new Date().toISOString()
      };

      if (db) {
        messageService.saveMessage(db, roomId, msg.nickname, msg.message);
      }

      io.to(roomId).emit('new_message', msg);
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      if (!roomId) return;
      const userNickname = roomService.getUserNickname(roomId, socket.id);
      if (!userNickname) return;
      socket.to(roomId).emit('typing_update', { nickname: userNickname, isTyping });
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        const leftUser = roomService.removeUserFromRoom(currentRoom, socket.id);
        if (leftUser) {
          io.to(currentRoom).emit('user_left', leftUser.nickname);
          io.to(currentRoom).emit('room_users', roomService.getRoomUsers(currentRoom));
        }
      }
    });
  });
}
