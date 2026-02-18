import { eq, and, desc, lt } from "drizzle-orm";
import { streamingSessions, InsertStreamingSession, StreamingSession } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new streaming session record
 */
export async function createStreamingSession(session: InsertStreamingSession): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(streamingSessions).values(session);
  return result[0].insertId;
}

/**
 * Update streaming session
 */
export async function updateStreamingSession(
  sessionId: string,
  updates: Partial<InsertStreamingSession>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(streamingSessions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(streamingSessions.sessionId, sessionId));
}

/**
 * Get streaming session by session ID
 */
export async function getStreamingSession(sessionId: string): Promise<StreamingSession | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db
    .select()
    .from(streamingSessions)
    .where(eq(streamingSessions.sessionId, sessionId))
    .limit(1);

  return result[0];
}

/**
 * Get user's streaming sessions
 */
export async function getUserStreamingSessions(userId: number, limit: number = 50): Promise<StreamingSession[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(streamingSessions)
    .where(eq(streamingSessions.userId, userId))
    .orderBy(desc(streamingSessions.createdAt))
    .limit(limit);
}

/**
 * Get active streaming sessions
 */
export async function getActiveStreamingSessions(userId?: number): Promise<StreamingSession[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const conditions = [
    eq(streamingSessions.status, "active")
  ];

  if (userId !== undefined) {
    conditions.push(eq(streamingSessions.userId, userId));
  }

  return await db
    .select()
    .from(streamingSessions)
    .where(and(...conditions))
    .orderBy(desc(streamingSessions.startedAt));
}

/**
 * Mark session as stopped
 */
export async function stopStreamingSession(
  sessionId: string,
  metrics?: {
    samplesProcessed?: string;
    bytesTransferred?: string;
    durationSeconds?: number;
    averageThroughputMbps?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(streamingSessions)
    .set({
      status: "stopped",
      stoppedAt: new Date(),
      ...metrics,
      updatedAt: new Date(),
    })
    .where(eq(streamingSessions.sessionId, sessionId));
}

/**
 * Mark session as error
 */
export async function markSessionError(
  sessionId: string,
  errorMessage: string,
  errorCode?: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(streamingSessions)
    .set({
      status: "error",
      errorMessage,
      errorCode,
      stoppedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(streamingSessions.sessionId, sessionId));
}

/**
 * Delete old streaming sessions
 */
export async function cleanupOldSessions(daysOld: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db
    .delete(streamingSessions)
    .where(and(
      eq(streamingSessions.status, "stopped"),
      lt(streamingSessions.stoppedAt, cutoffDate)
    ));

  return result[0].affectedRows || 0;
}
