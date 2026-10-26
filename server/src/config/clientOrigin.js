export const DEFAULT_CLIENT_ORIGIN = 'https://hellenicdev.eu';

export function resolveClientOrigin(env = process.env) {
  const configured = env.CLIENT_ORIGIN;
  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim();
  }
  return DEFAULT_CLIENT_ORIGIN;
}
