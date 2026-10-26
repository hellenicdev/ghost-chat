import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { io } from 'socket.io-client';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function waitFor(socket, event, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/index.js'], {
      cwd: serverDir,
      env: { ...process.env, PORT: '0', CLIENT_ORIGIN: 'https://hellenicdev.eu' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      reject(new Error(`server did not start\n${output}`));
    }, 5000);

    const onData = (chunk) => {
      output += chunk.toString();
      const match = output.match(/Server running on port (\d+)/);
      if (!match || settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ child, port: Number(match[1]) });
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`server exited early (${code})\n${output}`));
    });
  });
}

test('live server survives bad payloads and enforces the buffer and IP limit', async () => {
  const started = await startServer();
  const { child, port } = started;
  const url = `http://127.0.0.1:${port}`;
  const sockets = [];

  const connect = async () => {
    const socket = io(url, { transports: ['websocket'], autoConnect: false });
    sockets.push(socket);
    const connected = waitFor(socket, 'connect');
    const nickname = waitFor(socket, 'nickname_assigned');
    socket.connect();
    await connected;
    await nickname;
    return socket;
  };

  try {
    const socket = await connect();
    const roomId = `live-${Date.now()}`;

    socket.emit('join_room', 12);
    socket.emit('join_room', { id: roomId });
    socket.emit('send_message', { roomId, message: 99 });
    socket.emit('send_message', { roomId, message: { text: 'nope' } });
    socket.emit('typing', null);
    socket.emit('typing', { roomId, isTyping: 'yes' });
    assert.equal(socket.connected, true);

    const joinedPromise = waitFor(socket, 'room_joined');
    socket.emit('join_room', roomId);
    const joined = await joinedPromise;
    assert.equal(joined.roomId, roomId);

    const messagePromise = waitFor(socket, 'new_message');
    socket.emit('send_message', { roomId, message: 'hello' });
    const message = await messagePromise;
    assert.equal(message.message, 'hello');

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const limitedPromise = waitFor(socket, 'rate_limited');
    for (let i = 0; i < 6; i += 1) {
      socket.emit('send_message', { roomId, message: `burst-${i}` });
    }
    await limitedPromise;

    const fresh = await connect();
    const freshJoined = waitFor(fresh, 'room_joined');
    fresh.emit('join_room', roomId);
    const history = await freshJoined;
    assert.ok(history.messages.some((row) => row.message === 'hello'));

    const disconnected = waitFor(socket, 'disconnect', 2000);
    socket.emit('send_message', { roomId, message: randomBytes(20 * 1024).toString('hex') });
    await disconnected;
    assert.equal(socket.connected, false);
    assert.equal(child.exitCode, null);

    const survivor = await connect();
    assert.equal(survivor.connected, true);
  } finally {
    for (const socket of sockets) socket.close();
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
});
