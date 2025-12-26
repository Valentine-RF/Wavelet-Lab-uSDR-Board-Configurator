/**
 * Shared test utilities for server-side tests
 * Reduces code duplication across test files
 */

import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Creates a mock authenticated context for testing protected procedures
 * @param overrides - Optional user property overrides
 */
export function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
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
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      get: (key: string) => {
        if (key === "host") return "localhost:3000";
        return undefined;
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

/**
 * Creates a mock admin context for testing admin procedures
 */
export function createAdminContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
  return createAuthContext({
    role: "admin",
    ...overrides,
  });
}

/**
 * Creates an unauthenticated context for testing public procedures
 */
export function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      get: (key: string) => {
        if (key === "host") return "localhost:3000";
        return undefined;
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

/**
 * Generates a unique test identifier for database entities
 */
export function generateTestId(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
