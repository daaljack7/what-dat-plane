// Simple rate limiting for API endpoints
// Tracks requests per IP address to prevent abuse

class RateLimiter {
  constructor(maxRequests = 10, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
    this.requests = new Map();
  }

  isRateLimited(identifier) {
    const now = Date.now();
    const windowStart = now - (this.windowSeconds * 1000);

    // Get or create request log for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requestLog = this.requests.get(identifier);

    // Filter out requests outside the current window
    const recentRequests = requestLog.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, recentRequests);

    // Check if rate limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return true;
    }

    // Add current request
    recentRequests.push(now);
    return false;
  }

  getRemainingRequests(identifier) {
    const now = Date.now();
    const windowStart = now - (this.windowSeconds * 1000);

    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }

    const requestLog = this.requests.get(identifier);
    const recentRequests = requestLog.filter(timestamp => timestamp > windowStart);

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    const cutoff = now - (this.windowSeconds * 1000);

    for (const [identifier, requestLog] of this.requests.entries()) {
      const recentRequests = requestLog.filter(timestamp => timestamp > cutoff);

      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Create rate limiters for different endpoints
// More lenient for general use, can be adjusted based on needs
export const flightRateLimiter = new RateLimiter(20, 60); // 20 requests per minute
export const geocodeRateLimiter = new RateLimiter(30, 60); // 30 requests per minute
export const trackRateLimiter = new RateLimiter(10, 60); // 10 requests per minute

// Cleanup every 5 minutes
setInterval(() => {
  flightRateLimiter.cleanup();
  geocodeRateLimiter.cleanup();
  trackRateLimiter.cleanup();
}, 5 * 60 * 1000);

// Helper function to get client IP from request
export function getClientIP(req) {
  // Check various headers for the real IP (useful when behind proxies/CDN)
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// Middleware-like function to check rate limit
export function checkRateLimit(rateLimiter, req, res) {
  const clientIP = getClientIP(req);

  if (rateLimiter.isRateLimited(clientIP)) {
    const remaining = rateLimiter.getRemainingRequests(clientIP);
    res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('Retry-After', rateLimiter.windowSeconds);

    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${rateLimiter.windowSeconds} seconds.`,
      retryAfter: rateLimiter.windowSeconds
    });
    return false;
  }

  // Set rate limit headers
  const remaining = rateLimiter.getRemainingRequests(clientIP);
  res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining - 1);

  return true;
}
