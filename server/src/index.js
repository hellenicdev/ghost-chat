import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupChatSocket } from './sockets/chatSocket.js';
import healthRouter from './routes/health.js';

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api', healthRouter);

let db = null;
try {
  const { getDb } = await import('./config/db.js');
  db = getDb();
  console.log('SQLite connected');
} catch (err) {
  console.warn('Database not available, running without persistence:', err.message);
}

setupChatSocket(io, db);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
