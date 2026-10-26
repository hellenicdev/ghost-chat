const DEFAULT_TTL_HOURS = 24;
const MAX_TTL_HOURS = 24 * 366;
const DEFAULT_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const MAX_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function resolveMessageTtlHours(value, fallback = DEFAULT_TTL_HOURS) {
  if (value === undefined || value === null || value === '') return fallback;
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_TTL_HOURS) {
    console.warn(`Invalid MESSAGE_TTL_HOURS "${value}"; using ${fallback}`);
    return fallback;
  }
  return hours;
}

export function resolveCleanupIntervalMs(value, fallback = DEFAULT_CLEANUP_INTERVAL_MS) {
  if (value === undefined || value === null || value === '') return fallback;
  const interval = Number(value);
  if (!Number.isInteger(interval) || interval < 1000 || interval > MAX_CLEANUP_INTERVAL_MS) {
    console.warn(`Invalid MESSAGE_CLEANUP_INTERVAL_MS "${value}"; using ${fallback}`);
    return fallback;
  }
  return interval;
}

export function saveMessage(db, roomId, nickname, message) {
  const stmt = db.prepare(
    'INSERT INTO messages (room_id, nickname, message) VALUES (?, ?, ?)'
  );
  const result = stmt.run(roomId, nickname, message);
  return {
    id: result.lastInsertRowid,
    nickname,
    message,
    timestamp: new Date().toISOString()
  };
}

export function getMessageHistory(db, roomId, limit = 50) {
  const stmt = db.prepare(
    'SELECT nickname, message, timestamp FROM messages WHERE room_id = ? ORDER BY id DESC LIMIT ?'
  );
  return stmt.all(roomId, limit).reverse();
}

export function deleteExpiredMessages(db, ttlHours) {
  const hours = Number(ttlHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_TTL_HOURS) {
    throw new Error('Invalid message TTL');
  }
  const result = db
    .prepare("DELETE FROM messages WHERE timestamp < datetime('now', ?)")
    .run(`-${hours} hours`);
  return result.changes;
}
