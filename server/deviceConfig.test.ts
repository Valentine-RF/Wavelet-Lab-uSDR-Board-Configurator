import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("deviceConfig", () => {
  it("creates a device configuration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const config = await caller.deviceConfig.create({
      name: "Test Config",
      description: "Test configuration for uSDR",
      rfPath: "trx1200_2100",
      rxCenterFreq: 2450000000,
      txCenterFreq: 2450000000,
      rxBandwidth: 20000000,
      txBandwidth: 20000000,
      rxLnaGain: 15,
      rxPgaGain: 10,
      rxVgaGain: 8,
      txGain: 40,
      clockSource: "internal",
      sampleRate: 40000000,
      dataFormat: "ci16",
      blockSize: 16384,
      connectionType: "pcie",
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      mode: "rx",
    });

    expect(config).toBeDefined();
    expect(config.name).toBe("Test Config");
    expect(config.rfPath).toBe("trx1200_2100");
    expect(config.rxCenterFreq).toBe("2450000000");
    expect(config.mode).toBe("rx");
  });

  it("lists device configurations for a user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a config first
    await caller.deviceConfig.create({
      name: "List Test Config",
      rxCenterFreq: 2450000000,
      txCenterFreq: 2450000000,
      rxBandwidth: 20000000,
      txBandwidth: 20000000,
      rxLnaGain: 15,
      rxPgaGain: 10,
      rxVgaGain: 8,
      txGain: 40,
      clockSource: "internal",
      sampleRate: 40000000,
      dataFormat: "ci16",
      blockSize: 16384,
      connectionType: "pcie",
      lnaOn: true,
      paOn: false,
      gpsdoOn: false,
      oscOn: false,
      mode: "rx",
    });

    const configs = await caller.deviceConfig.list();

    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
    expect(configs[0]).toHaveProperty("name");
    expect(configs[0]).toHaveProperty("rxCenterFreq");
  });

  it("validates frequency ranges", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.deviceConfig.create({
        name: "Invalid Config",
        rxCenterFreq: -1000, // Invalid negative frequency
        txCenterFreq: 2450000000,
        rxBandwidth: 20000000,
        txBandwidth: 20000000,
        rxLnaGain: 15,
        rxPgaGain: 10,
        rxVgaGain: 8,
        txGain: 40,
        clockSource: "internal",
        sampleRate: 40000000,
        dataFormat: "ci16",
        blockSize: 16384,
        connectionType: "pcie",
        lnaOn: true,
        paOn: false,
        gpsdoOn: false,
        oscOn: false,
        mode: "rx",
      })
    ).rejects.toThrow();
  });

  it("validates gain ranges", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.deviceConfig.create({
        name: "Invalid Gain Config",
        rxCenterFreq: 2450000000,
        txCenterFreq: 2450000000,
        rxBandwidth: 20000000,
        txBandwidth: 20000000,
        rxLnaGain: 100, // Invalid - exceeds max of 30
        rxPgaGain: 10,
        rxVgaGain: 8,
        txGain: 40,
        clockSource: "internal",
        sampleRate: 40000000,
        dataFormat: "ci16",
        blockSize: 16384,
        connectionType: "pcie",
        lnaOn: true,
        paOn: false,
        gpsdoOn: false,
        oscOn: false,
        mode: "rx",
      })
    ).rejects.toThrow();
  });

  it("validates clock source enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.deviceConfig.create({
        name: "Invalid Clock Config",
        rxCenterFreq: 2450000000,
        txCenterFreq: 2450000000,
        rxBandwidth: 20000000,
        txBandwidth: 20000000,
        rxLnaGain: 15,
        rxPgaGain: 10,
        rxVgaGain: 8,
        txGain: 40,
        clockSource: "invalid" as any, // Invalid clock source
        sampleRate: 40000000,
        dataFormat: "ci16",
        blockSize: 16384,
        connectionType: "pcie",
        lnaOn: true,
        paOn: false,
        gpsdoOn: false,
        oscOn: false,
        mode: "rx",
      })
    ).rejects.toThrow();
  });
});

describe("deviceStatus", () => {
  it("logs device status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deviceStatus.log({
      connectionState: "connected",
      deviceId: "usdr-dev-001",
      throughputMbps: 320,
      notes: "Test connection",
    });

    expect(result.success).toBe(true);
  });

  it("retrieves recent device status logs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Log a status first
    await caller.deviceStatus.log({
      connectionState: "streaming",
      deviceId: "usdr-dev-001",
      throughputMbps: 320,
    });

    const logs = await caller.deviceStatus.recent({ limit: 5 });

    expect(Array.isArray(logs)).toBe(true);
  });
});
