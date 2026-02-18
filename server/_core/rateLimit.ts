import { Request, Response, NextFunction } from "express";

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-backed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 100, // 100 requests per window for general API
  maxAuthRequests: 10, // 10 auth attempts per window
  maxStreamingRequests: 20, // 20 streaming starts per window
};

// In-memory store for rate limiting
// Note: In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

/**
 * Get client identifier for rate limiting
 * Uses IP address, falling back to a default for local development
 */
function getClientId(req: Request): string {
  // Use req.ip which respects Express "trust proxy" settings.
  // Do NOT trust X-Forwarded-For directly — it can be spoofed by clients.
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(
  clientId: string,
  category: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${category}:${clientId}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * General API rate limiter middleware
 * Limits to 100 requests per minute per IP
 */
export function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientId = getClientId(req);
  const result = checkRateLimit(
    clientId,
    "api",
    RATE_LIMIT_CONFIG.maxRequests,
    RATE_LIMIT_CONFIG.windowMs
  );

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxRequests);
  res.setHeader("X-RateLimit-Remaining", result.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000));

  if (!result.allowed) {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
    return;
  }

  next();
}

/**
 * Authentication rate limiter middleware
 * More restrictive - 10 attempts per minute per IP
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientId = getClientId(req);
  const result = checkRateLimit(
    clientId,
    "auth",
    RATE_LIMIT_CONFIG.maxAuthRequests,
    RATE_LIMIT_CONFIG.windowMs
  );

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxAuthRequests);
  res.setHeader("X-RateLimit-Remaining", result.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000));

  if (!result.allowed) {
    res.status(429).json({
      error: "Too many authentication attempts",
      message: "Please wait before trying again.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
    return;
  }

  next();
}

/**
 * Streaming rate limiter middleware
 * Limits streaming session starts to prevent abuse
 */
export function streamingRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientId = getClientId(req);
  const result = checkRateLimit(
    clientId,
    "streaming",
    RATE_LIMIT_CONFIG.maxStreamingRequests,
    RATE_LIMIT_CONFIG.windowMs
  );

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxStreamingRequests);
  res.setHeader("X-RateLimit-Remaining", result.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000));

  if (!result.allowed) {
    res.status(429).json({
      error: "Too many streaming requests",
      message: "Please wait before starting another stream.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
    return;
  }

  next();
}

/**
 * Get current rate limit stats (for admin/monitoring)
 */
export function getRateLimitStats(): { totalEntries: number; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = {};

  Array.from(rateLimitStore.keys()).forEach((key) => {
    const category = key.split(":")[0];
    byCategory[category] = (byCategory[category] || 0) + 1;
  });

  return {
    totalEntries: rateLimitStore.size,
    byCategory,
  };
}
