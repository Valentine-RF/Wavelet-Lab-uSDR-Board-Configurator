import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initStreamingServer } from "../streamingServer";
import { securityHeaders } from "./securityHeaders";
import { apiRateLimiter, authRateLimiter, stopRateLimitCleanup } from "./rateLimit";
import { deviceControl } from "../deviceControl";
import { closePool } from "../db";


function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust first proxy for correct client IP in rate limiting
  const server = createServer(app);
  
  // Initialize WebSocket streaming server
  initStreamingServer(server);
  
  // Health check endpoint for Docker/load balancer probes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Security headers (production)
  app.use(securityHeaders);

  // Configure body parser — 5MB is sufficient for JSON configuration payloads
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));

  // Rate limiting for OAuth routes (more restrictive)
  app.use("/api/oauth", authRateLimiter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // CSRF protection: reject non-GET requests without JSON content type
  app.use("/api/trpc", (req, res, next) => {
    if (req.method !== 'GET' && !req.headers['content-type']?.includes('application/json')) {
      res.status(403).json({ error: 'Invalid content type' });
      return;
    }
    next();
  });

  // Rate limiting for tRPC API (general rate limit)
  app.use("/api/trpc", apiRateLimiter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket streaming available at ws://localhost:${port}/api/stream`);
  });

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}, shutting down gracefully...`);
    // Stop accepting new connections
    server.close();
    // Stop all active streaming sessions (kills child processes)
    for (const session of deviceControl.getActiveSessions()) {
      try { await deviceControl.stopStream(session.sessionId); } catch { /* best effort */ }
    }
    // Stop rate limiter cleanup interval
    stopRateLimitCleanup();
    // Close database connection pool
    await closePool();
    console.log('[Server] Shutdown complete');
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

startServer().catch(console.error);
