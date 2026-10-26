const DEFAULT_WINDOW_MS = 1000;
const DEFAULT_MAX_MESSAGES = 5;

function normalizeIp(ip) {
  if (typeof ip !== 'string') return '';
  let value = ip.trim();
  if (value.startsWith('::ffff:')) {
    value = value.slice('::ffff:'.length);
  }
  return value;
}

function forwardedHops(socket) {
  const raw = socket?.handshake?.headers?.['x-forwarded-for'];
  const header = Array.isArray(raw) ? raw.join(',') : raw;
  if (typeof header !== 'string' || !header.trim()) return [];
  return header.split(',').map(normalizeIp).filter(Boolean);
}

// Trust one reverse proxy. It appends the client it actually saw, so the
// rightmost hop is that client and a spoofed prefix is ignored.
export function getClientIp(socket) {
  const remote = normalizeIp(socket?.handshake?.address) || 'unknown';
  const hops = forwardedHops(socket);
  if (hops.length === 0) return remote;
  return hops[hops.length - 1];
}

export function createRateLimiter({
  windowMs = DEFAULT_WINDOW_MS,
  maxMessages = DEFAULT_MAX_MESSAGES
} = {}) {
  const rateMap = new Map();
  const timers = new Map();

  function recentTimestamps(key, now) {
    const existing = rateMap.get(key);
    if (!existing) return [];
    return existing.filter((timestamp) => now - timestamp < windowMs);
  }

  function schedulePrune(key, timestamps, now) {
    const pending = timers.get(key);
    if (pending) clearTimeout(pending);

    if (timestamps.length === 0) {
      rateMap.delete(key);
      timers.delete(key);
      return;
    }

    const newest = timestamps[timestamps.length - 1];
    const delay = Math.max(windowMs - (now - newest), 0);
    const timer = setTimeout(() => {
      timers.delete(key);
      const still = recentTimestamps(key, Date.now());
      if (still.length === 0) {
        rateMap.delete(key);
        return;
      }
      rateMap.set(key, still);
      schedulePrune(key, still, Date.now());
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
    timers.set(key, timer);
  }

  function checkRateLimit(key) {
    if (typeof key !== 'string' || !key) return false;
    const now = Date.now();
    const timestamps = recentTimestamps(key, now);
    timestamps.push(now);
    rateMap.set(key, timestamps);
    return timestamps.length <= maxMessages;
  }

  // Called on disconnect. The entry stays until the active window expires so a
  // reconnect in that window cannot reset the limit, then the key is removed.
  function clearRateLimit(key) {
    if (typeof key !== 'string' || !key) return;
    const now = Date.now();
    const timestamps = recentTimestamps(key, now);
    if (timestamps.length === 0) {
      const pending = timers.get(key);
      if (pending) clearTimeout(pending);
      rateMap.delete(key);
      timers.delete(key);
      return;
    }
    rateMap.set(key, timestamps);
    schedulePrune(key, timestamps, now);
  }

  function resetRateLimiter() {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    rateMap.clear();
  }

  return {
    checkRateLimit,
    clearRateLimit,
    resetRateLimiter,
    size: () => rateMap.size
  };
}

const limiter = createRateLimiter();

export const checkRateLimit = limiter.checkRateLimit;
export const clearRateLimit = limiter.clearRateLimit;
export const resetRateLimiter = limiter.resetRateLimiter;
