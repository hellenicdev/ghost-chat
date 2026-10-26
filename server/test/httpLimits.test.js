import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { DEFAULT_CLIENT_ORIGIN, resolveClientOrigin } from '../src/config/clientOrigin.js';
import { attachSocketServer, MAX_HTTP_BUFFER_SIZE } from '../src/socketServer.js';

test('cors defaults to the GhostChat site and can be overridden', () => {
  assert.equal(DEFAULT_CLIENT_ORIGIN, 'https://hellenicdev.eu');
  assert.equal(resolveClientOrigin({}), 'https://hellenicdev.eu');
  assert.equal(resolveClientOrigin({ CLIENT_ORIGIN: '   ' }), 'https://hellenicdev.eu');
  assert.equal(
    resolveClientOrigin({ CLIENT_ORIGIN: ' https://preview.example ' }),
    'https://preview.example'
  );
});

test('socket server rejects payloads above 16KB', () => {
  assert.equal(MAX_HTTP_BUFFER_SIZE, 16 * 1024);
  const httpServer = createServer();
  const io = attachSocketServer(httpServer, DEFAULT_CLIENT_ORIGIN);
  try {
    assert.equal(io.engine.opts.maxHttpBufferSize, 16 * 1024);
    assert.equal(io.opts.cors.origin, DEFAULT_CLIENT_ORIGIN);
  } finally {
    io.close();
    httpServer.close();
  }
});
