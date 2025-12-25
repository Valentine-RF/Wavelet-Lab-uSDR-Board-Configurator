import { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware for production deployment
 * Implements OWASP recommended security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === "production";

  // Content Security Policy (CSP)
  // SECURITY: 'unsafe-eval' only allowed in development for HMR/debugging
  // Production builds should not require eval
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'" // No unsafe-eval in production
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"; // Dev needs eval for HMR

  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' wss: ws:",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // Prevent clickjacking attacks
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features and APIs
  res.setHeader(
    "Permissions-Policy",
    [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", ")
  );

  // Enforce HTTPS in production (HSTS)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
}
