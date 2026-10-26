import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { createRateLimiter, getClientIp } from '../src/utils/rateLimiter.js';

function socketWith(address, forwardedFor) {
  const headers = {};
  if (forwardedFor !== undefined) headers['x-forwarded-for'] = forwardedFor;
  return { handshake: { address, headers } };
}

test('uses the proxy-observed client address', () => {
  assert.equal(getClientIp(socketWith('::ffff:127.0.0.1')), '127.0.0.1');
  assert.equal(getClientIp(socketWith('10.0.0.1', '203.0.113.5')), '203.0.113.5');
  assert.equal(
    getClientIp(socketWith('10.0.0.1', '9.9.9.9, 203.0.113.5')),
    '203.0.113.5'
  );
  assert.equal(getClientIp(socketWith('10.0.0.1', '  ,  ')), '10.0.0.1');
  assert.equal(getClientIp(socketWith('198.51.100.8', ['1.1.1.1', '198.51.100.9'])), '198.51.100.9');
  assert.equal(getClientIp({}), 'unknown');
});

test('shares a limit across reconnects and deletes the entry after the window', () => {
  mock.timers.enable({ apis: ['Date', 'setTimeout'] });
  try {
    const limiter = createRateLimiter({ windowMs: 1000, maxMessages: 1 });
    assert.equal(limiter.checkRateLimit('203.0.113.9'), true);
    assert.equal(limiter.checkRateLimit('203.0.113.10'), true);
    assert.equal(limiter.checkRateLimit('203.0.113.9'), false);

    limiter.clearRateLimit('203.0.113.9');
    assert.equal(limiter.checkRateLimit('203.0.113.9'), false);
    assert.equal(limiter.size(), 2);

    mock.timers.tick(1000);
    assert.equal(limiter.size(), 1);
    assert.equal(limiter.checkRateLimit('203.0.113.9'), true);
  } finally {
    mock.timers.reset();
  }
});
