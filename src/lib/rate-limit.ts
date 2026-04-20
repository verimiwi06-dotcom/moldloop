/**
 * Simple in-memory rate limiter for Moldloop.
 * Prevents abuse by limiting loop starts per IP.
 *
 * For production at scale, swap this with Upstash Redis rate limiter.
 * This in-memory version works fine for Vercel serverless (per-instance).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 3;            // 3 simulations per 10 min per IP

/** Clean up expired entries periodically */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 5 * 60 * 1000);
}

/**
 * Check rate limit for a given identifier (IP hash).
 * Returns { allowed, remaining, resetIn } 
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Fresh window
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInSeconds: Math.ceil(WINDOW_MS / 1000) };
  }

  if (entry.count < MAX_REQUESTS) {
    entry.count++;
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetInSeconds };
  }

  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: false, remaining: 0, resetInSeconds };
}

/**
 * Hash an IP address for privacy-safe storage and rate limiting.
 * Uses a simple but effective hash for serverless environments.
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.RATE_LIMIT_SALT || 'moldloop-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
