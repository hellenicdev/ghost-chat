import assert from 'node:assert/strict';
import test from 'node:test';
import { setupChatSocket } from '../src/sockets/chatSocket.js';
import { resetRateLimiter } from '../src/utils/rateLimiter.js';

function createFixture(db = null) {
  const roomEvents = [];
  let onConnection;
  const io = {
    on(event, handler) {
      if (event === 'connection') onConnection = handler;
    },
    to() {
      return {
        emit(event, payload) {
          roomEvents.push({ event, payload });
        }
      };
    }
  };
  setupChatSocket(io, db);

  function connect({ id, address = '203.0.113.20', headers = {} }) {
    const emitted = [];
    const handlers = {};
    const socket = {
      id,
      handshake: { address, headers },
      emitted,
      on(event, fn) {
        handlers[event] = fn;
      },
      emit(event, payload) {
        emitted.push({ event, payload });
      },
      join() {},
      leave() {},
      to() {
        return {
          emit(event, payload) {
            roomEvents.push({ event, payload });
          }
        };
      },
      handlers
    };
    onConnection(socket);
    return socket;
  }

  return { connect, roomEvents };
}

function messagesOf(roomEvents) {
  return roomEvents.filter((event) => event.event === 'new_message');
}

test('rejects non-string messages and typing values without throwing', () => {
  resetRateLimiter();
  const { connect, roomEvents } = createFixture();
  const socket = connect({ id: 'sock-validate' });
  socket.handlers.join_room('Room-A');

  const badMessages = [
    undefined,
    null,
    'hello',
    12,
    { roomId: 'room-a', message: 12 },
    { roomId: 'room-a', message: { trim() { throw new Error('trim should not run'); } } },
    { roomId: { trim() { throw new Error('room trim should not run'); } }, message: 'hi' },
    { roomId: 'room-a', message: '   ' }
  ];

  for (const payload of badMessages) {
    assert.doesNotThrow(() => socket.handlers.send_message(payload));
  }
  assert.equal(messagesOf(roomEvents).length, 0);

  assert.doesNotThrow(() => socket.handlers.typing(null));
  assert.doesNotThrow(() => socket.handlers.typing(undefined));
  assert.doesNotThrow(() => socket.handlers.typing({ roomId: 'room-a', isTyping: 'true' }));
  assert.doesNotThrow(() => socket.handlers.typing({ roomId: 'room-a', isTyping: 1 }));
  assert.equal(roomEvents.filter((event) => event.event === 'typing_update').length, 0);

  socket.handlers.typing({ roomId: 'room-a', isTyping: true });
  const typing = roomEvents.filter((event) => event.event === 'typing_update');
  assert.equal(typing.length, 1);
  assert.equal(typing[0].payload.isTyping, true);

  socket.handlers.disconnect();
});

test('limits room ids and trims stored message length', () => {
  resetRateLimiter();
  const { connect, roomEvents } = createFixture();
  const socket = connect({ id: 'sock-limits' });

  assert.doesNotThrow(() => socket.handlers.join_room('a'.repeat(65)));
  assert.doesNotThrow(() => socket.handlers.join_room(15));
  assert.equal(socket.emitted.some((event) => event.event === 'room_joined'), false);

  const roomId = 'b'.repeat(64);
  socket.handlers.join_room(roomId);
  const joined = socket.emitted.find((event) => event.event === 'room_joined');
  assert.equal(joined.payload.roomId, roomId);

  socket.handlers.send_message({ roomId, message: `  ${'c'.repeat(600)}` });
  const sent = messagesOf(roomEvents);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].payload.message.length, 500);
  socket.handlers.disconnect();
});

test('rate limit follows the client IP across socket ids', () => {
  resetRateLimiter();
  const { connect, roomEvents } = createFixture();
  const headers = { 'x-forwarded-for': '9.9.9.9, 203.0.113.40' };
  const first = connect({ id: 'sock-old', address: '10.0.0.4', headers });
  first.handlers.join_room('limited');

  for (let i = 0; i < 5; i += 1) {
    first.handlers.send_message({ roomId: 'limited', message: `m${i}` });
  }
  assert.equal(messagesOf(roomEvents).length, 5);
  first.handlers.disconnect();

  const reconnected = connect({ id: 'sock-new', address: '10.0.0.8', headers });
  reconnected.handlers.join_room('limited');
  reconnected.handlers.send_message({ roomId: 'limited', message: 'again' });
  assert.equal(reconnected.emitted.some((event) => event.event === 'rate_limited'), true);
  assert.equal(messagesOf(roomEvents).length, 5);

  const other = connect({ id: 'sock-other', address: '203.0.113.41' });
  other.handlers.join_room('limited');
  other.handlers.send_message({ roomId: 'limited', message: 'from elsewhere' });
  assert.equal(other.emitted.some((event) => event.event === 'rate_limited'), false);
  assert.equal(messagesOf(roomEvents).length, 6);

  reconnected.handlers.disconnect();
  other.handlers.disconnect();
});

test('database failures do not escape the socket handlers', () => {
  resetRateLimiter();
  const original = console.error;
  console.error = () => {};
  try {
    const db = {
      prepare() {
        throw new Error('db down');
      }
    };
    const { connect, roomEvents } = createFixture(db);
    const socket = connect({ id: 'sock-db' });
    assert.doesNotThrow(() => socket.handlers.join_room('persist'));
    const joined = socket.emitted.find((event) => event.event === 'room_joined');
    assert.equal(joined.payload.roomId, 'persist');
    assert.deepEqual(joined.payload.messages, []);
    assert.doesNotThrow(() => socket.handlers.send_message({ roomId: 'persist', message: 'still sent' }));
    assert.equal(messagesOf(roomEvents).length, 1);
    assert.doesNotThrow(() => socket.handlers.disconnect());
  } finally {
    console.error = original;
  }
});
