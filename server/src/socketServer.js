import { Server } from 'socket.io';

export const MAX_HTTP_BUFFER_SIZE = 16 * 1024;

export function attachSocketServer(httpServer, clientOrigin) {
  return new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST']
    },
    maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE
  });
}
