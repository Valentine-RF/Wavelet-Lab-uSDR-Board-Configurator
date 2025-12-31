import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import * as streamingDb from "./streamingDb";
import { deviceControl } from "./deviceControl";
import { createAuthContext } from "./test-utils";

describe("streaming procedures", () => {
  // Add error handler to prevent unhandled errors during tests
  beforeEach(() => {
    deviceControl.on('session-error', (sessionId, error) => {
      // Silently handle errors during tests
      console.log(`[Test] Stream error for session ${sessionId}:`, (error as Error).message);
    });
  });

  afterEach(() => {
    // Clean up all listeners
    deviceControl.removeAllListeners('session-error');
  });
  it("should generate WebSocket URL for a valid session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a mock session in the database
    const sessionId = "test-session-" + Date.now();
    await streamingDb.createStreamingSession({
      userId: ctx.user!.id,
      sessionId,
      status: "active",
      outputMode: "websocket",
    });

    // Get WebSocket URL
    const result = await caller.streaming.getWebSocketUrl({ sessionId });

    expect(result).toHaveProperty("url");
    expect(result.url).toContain("/api/stream");
    expect(result.url).toContain(`sessionId=${sessionId}`);
    expect(result.url).toContain(`token=`);
    expect(result.url).toMatch(/^wss?:\/\//);
  });

  it("should reject WebSocket URL request for non-existent session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.streaming.getWebSocketUrl({ sessionId: "non-existent-session" })
    ).rejects.toThrow("Session not found or access denied");
  });

  it("should list user streaming history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test session
    const sessionId = "history-test-" + Date.now();
    await streamingDb.createStreamingSession({
      userId: ctx.user!.id,
      sessionId,
      status: "stopped",
      outputMode: "websocket",
      command: "usdr_dm_create -r 40000000 -F ci16",
    });

    // List history
    const history = await caller.streaming.listHistory({ limit: 10 });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    const session = history.find(s => s.sessionId === sessionId);
    expect(session).toBeDefined();
    expect(session?.userId).toBe(ctx.user!.id);
    expect(session?.status).toBe("stopped");
  });

  it("should validate streaming configuration schema", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validConfig = {
      rfPath: "trx1200_2100",
      rxCenterFreq: 2450000000,
      txCenterFreq: 2450000000,
      rxBandwidth: 20000000,
      txBandwidth: 20000000,
      rxLnaGain: 15,
      rxPgaGain: 10,
      rxVgaGain: 8,
      txGain: 40,
      clockSource: "internal" as const,
      sampleRate: 40000000,
      dataFormat: "ci16",
      blockSize: 16384,
      connectionType: "pcie" as const,
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      mode: "rx" as const,
      outputMode: "websocket" as const,
    };

    // Start stream - this validates the schema is correct
    // The process will spawn (even if usdr_dm_create doesn't exist) and the procedure will succeed
    const result = await caller.streaming.start({ config: validConfig });
    
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("command");
    expect(result.command).toContain("usdr_dm_create");
    expect(result.command).toContain("-r 40000000");
    expect(result.command).toContain("-F ci16");
    expect(result.command).toContain("-e 2450000000");
    
    // Clean up: stop the stream
    if (result.sessionId) {
      try {
        await caller.streaming.stop({ sessionId: result.sessionId });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  it("should reject invalid gain values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invalidConfig = {
      rfPath: "trx1200_2100",
      rxCenterFreq: 2450000000,
      txCenterFreq: 2450000000,
      rxBandwidth: 20000000,
      txBandwidth: 20000000,
      rxLnaGain: 100, // Invalid: max is 30
      rxPgaGain: 10,
      rxVgaGain: 8,
      txGain: 40,
      clockSource: "internal" as const,
      sampleRate: 40000000,
      dataFormat: "ci16",
      blockSize: 16384,
      connectionType: "pcie" as const,
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      mode: "rx" as const,
      outputMode: "websocket" as const,
    };

    await expect(
      caller.streaming.start({ config: invalidConfig })
    ).rejects.toThrow();
  });

  it("should update session metrics on stop", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a session
    const sessionId = "metrics-test-" + Date.now();
    await streamingDb.createStreamingSession({
      userId: ctx.user!.id,
      sessionId,
      status: "active",
      outputMode: "websocket",
    });

    // Stop with metrics
    await streamingDb.stopStreamingSession(sessionId, {
      samplesProcessed: "1000000",
      bytesTransferred: "4000000",
      durationSeconds: 10,
      averageThroughputMbps: 3,
    });

    // Verify metrics were saved
    const session = await streamingDb.getStreamingSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.status).toBe("stopped");
    expect(session?.samplesProcessed).toBe("1000000");
    expect(session?.bytesTransferred).toBe("4000000");
    expect(session?.durationSeconds).toBe(10);
    expect(session?.averageThroughputMbps).toBe(3);
  });
});
