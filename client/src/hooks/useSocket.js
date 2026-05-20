import { useEffect, useState, useCallback, useRef } from 'react';
import socket from '../utils/socket';

export default function useSocket() {
  const [connected, setConnected] = useState(socket.connected);
  const [nickname, setNickname] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }
    function onNickname(data) { setNickname(data); }
    function onRoomJoined(data) {
      setRoomId(data.roomId);
      setNickname(data.nickname);
      setUsers(data.users);
      setMessages(data.messages || []);
    }
    function onNewMessage(msg) {
      setMessages(prev => [...prev, msg]);
    }
    function onUserJoined(nick) {
      setUsers(prev => [...prev, nick]);
    }
    function onUserLeft(nick) {
      setUsers(prev => prev.filter(u => u !== nick));
    }
    function onTypingUpdate({ nickname, isTyping }) {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) {
          next[nickname] = true;
        } else {
          delete next[nickname];
        }
        return next;
      });
    }
    function onRateLimited(msg) {
      console.warn(msg);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('nickname_assigned', onNickname);
    socket.on('room_joined', onRoomJoined);
    socket.on('new_message', onNewMessage);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_update', onTypingUpdate);
    socket.on('rate_limited', onRateLimited);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('nickname_assigned', onNickname);
      socket.off('room_joined', onRoomJoined);
      socket.off('new_message', onNewMessage);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_update', onTypingUpdate);
      socket.off('rate_limited', onRateLimited);
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((id) => {
    socket.emit('join_room', id);
  }, []);

  const sendMessage = useCallback((message) => {
    if (!roomId || !message.trim()) return;
    socket.emit('send_message', { roomId, message: message.trim() });
  }, [roomId]);

  const emitTyping = useCallback((isTyping) => {
    if (!roomId) return;
    socket.emit('typing', { roomId, isTyping });
    if (isTyping) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId, isTyping: false });
      }, 2000);
    }
  }, [roomId]);

  return {
    connected,
    nickname,
    roomId,
    messages,
    users,
    typingUsers,
    joinRoom,
    sendMessage,
    emitTyping
  };
}
