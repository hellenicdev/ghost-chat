import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { migrate } from '../src/config/db.js';
import {
  deleteExpiredMessages,
  getMessageHistory,
  resolveCleanupIntervalMs,
  resolveMessageTtlHours
} from '../src/services/messageService.js';

function createDb() {
  const db = new Database(':memory:');
  migrate(db);
  return db;
}

test('message ttl keeps recent rows and deletes older ones', () => {
  const db = createDb();
  const insert = db.prepare(
    `INSERT INTO messages (room_id, nickname, message, timestamp)
     VALUES (?, ?, ?, datetime('now', ?))`
  );
  insert.run('room-a', 'ada', 'old', '-25 hours');
  insert.run('room-a', 'ada', 'recent', '-23 hours');
  insert.run('room-b', 'bea', 'other-room', '-48 hours');

  const removed = deleteExpiredMessages(db, 24);
  assert.equal(removed, 2);

  const history = getMessageHistory(db, 'room-a');
  assert.deepEqual(history.map((row) => row.message), ['recent']);
  assert.equal(getMessageHistory(db, 'room-b').length, 0);
  db.close();
});

test('history returns the latest 50 messages in chronological order', () => {
  const db = createDb();
  const insert = db.prepare(
    'INSERT INTO messages (room_id, nickname, message) VALUES (?, ?, ?)'
  );
  for (let i = 0; i < 60; i += 1) insert.run('room-a', 'ada', `m${i}`);
  const history = getMessageHistory(db, 'room-a');
  assert.equal(history.length, 50);
  assert.equal(history[0].message, 'm10');
  assert.equal(history.at(-1).message, 'm59');
  db.close();
});

test('ttl and cleanup settings fall back when unset or invalid', () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(message);
  try {
    assert.equal(resolveMessageTtlHours(undefined), 24);
    assert.equal(resolveMessageTtlHours('48'), 48);
    assert.equal(resolveMessageTtlHours('0'), 24);
    assert.equal(resolveMessageTtlHours('nope'), 24);
    assert.equal(resolveCleanupIntervalMs(''), 600000);
    assert.equal(resolveCleanupIntervalMs('5000'), 5000);
    assert.equal(resolveCleanupIntervalMs('10'), 600000);
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 3);
});
