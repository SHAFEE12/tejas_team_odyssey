/**
 * copilotRateLimiter.js
 *
 * Lightweight, in-memory sliding window rate limiter for Career Copilot queries.
 * Prevents rapid abuse, request loops, and excessive compute/LLM cost without adding heavy external dependencies.
 * Default: 30 requests per 60 seconds per authenticated student.
 */

const userRequestLogs = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

function copilotRateLimiter(req, res, next) {
  const userId = req.user?._id?.toString() || req.ip || 'anonymous';
  const now = Date.now();

  const timestamps = userRequestLogs.get(userId) || [];
  // Filter out timestamps older than the sliding window
  const recentTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recentTimestamps.length >= MAX_REQUESTS) {
    const oldest = recentTimestamps[0];
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);

    res.set('Retry-After', String(retryAfterSec));
    res.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.set('X-RateLimit-Remaining', '0');

    return res.status(429).json({
      success: false,
      message: `Too many copilot requests. Rate limit is ${MAX_REQUESTS} requests per minute. Please wait ${retryAfterSec}s.`,
    });
  }

  recentTimestamps.push(now);
  userRequestLogs.set(userId, recentTimestamps);

  res.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.set('X-RateLimit-Remaining', String(MAX_REQUESTS - recentTimestamps.length));

  // Periodic map cleanup to avoid memory leaks
  if (userRequestLogs.size > 5000) {
    for (const [uid, log] of userRequestLogs.entries()) {
      const active = log.filter((t) => now - t < WINDOW_MS);
      if (active.length === 0) {
        userRequestLogs.delete(uid);
      } else {
        userRequestLogs.set(uid, active);
      }
    }
  }

  next();
}

/**
 * Resets tracking map (used for automated tests).
 */
function resetRateLimits() {
  userRequestLogs.clear();
}

module.exports = {
  copilotRateLimiter,
  resetRateLimits,
  MAX_REQUESTS,
  WINDOW_MS,
};
