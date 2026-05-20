const rateMap = new Map();

const WINDOW_MS = 1000;
const MAX_MESSAGES = 5;

export function checkRateLimit(socketId) {
  const now = Date.now();
  if (!rateMap.has(socketId)) {
    rateMap.set(socketId, []);
  }
  const timestamps = rateMap.get(socketId).filter(t => now - t < WINDOW_MS);
  timestamps.push(now);
  rateMap.set(socketId, timestamps);
  return timestamps.length <= MAX_MESSAGES;
}
