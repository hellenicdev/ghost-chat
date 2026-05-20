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
