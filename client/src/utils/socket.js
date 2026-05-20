import { io } from 'socket.io-client';

const DEV_URL = 'http://localhost:3001';
const PROD_URL = 'https://ghost-chat.onrender.com';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? DEV_URL : PROD_URL);

const socket = io(SOCKET_URL, {
  autoConnect: false
});

export default socket;
