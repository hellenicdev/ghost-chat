import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { setupChatSocket } from './sockets/chatSocket.js';
import healthRouter from './routes/health.js';
import { attachSocketServer } from './socketServer.js';
import { resolveClientOrigin } from './config/clientOrigin.js';
import {
  deleteExpiredMessages,
  resolveCleanupIntervalMs,
  resolveMessageTtlHours
} from './services/messageService.js';

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = resolveClientOrigin();
const MESSAGE_TTL_HOURS = resolveMessageTtlHours(process.env.MESSAGE_TTL_HOURS);
const MESSAGE_CLEANUP_INTERVAL_MS = resolveCleanupIntervalMs(process.env.MESSAGE_CLEANUP_INTERVAL_MS);

const app = express();
const server = createServer(app);
const io = attachSocketServer(server, CLIENT_ORIGIN);

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

if (db) {
  const cleanup = () => {
    try {
      const removed = deleteExpiredMessages(db, MESSAGE_TTL_HOURS);
      if (removed > 0) {
        console.log(`Deleted ${removed} expired message(s)`);
      }
    } catch (err) {
      console.error('Message cleanup failed:', err);
    }
  };
  cleanup();
  const timer = setInterval(cleanup, MESSAGE_CLEANUP_INTERVAL_MS);
  timer.unref();
}

server.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  const boundPort = address && typeof address === 'object' ? address.port : PORT;
  console.log(`Server running on port ${boundPort}`);
});
