import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, deviceConfigs, InsertDeviceConfig, DeviceConfig, deviceStatusLog, InsertDeviceStatusLog, commandHistory, InsertCommandHistory, CommandHistory, userTemplates, InsertUserTemplate, UserTemplate, templateFavorites, InsertTemplateFavorite, TemplateFavorite } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get user by OpenID
 * @returns User or null if not found/DB unavailable
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : null;
}

// Device Configuration Functions

export async function createDeviceConfig(config: InsertDeviceConfig): Promise<DeviceConfig> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(deviceConfigs).values(config);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(deviceConfigs).where(eq(deviceConfigs.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getUserDeviceConfigs(userId: number): Promise<DeviceConfig[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(deviceConfigs)
    .where(eq(deviceConfigs.userId, userId))
    .orderBy(desc(deviceConfigs.updatedAt));
}

/**
 * Get device config by ID for a specific user
 * @returns DeviceConfig or null if not found/DB unavailable
 */
export async function getDeviceConfigById(configId: number, userId: number): Promise<DeviceConfig | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(deviceConfigs)
    .where(and(
      eq(deviceConfigs.id, configId),
      eq(deviceConfigs.userId, userId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update device config for a specific user
 * @returns Updated DeviceConfig or null if not found
 * @throws Error if database unavailable
 */
export async function updateDeviceConfig(configId: number, userId: number, updates: Partial<InsertDeviceConfig>): Promise<DeviceConfig | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(deviceConfigs)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(deviceConfigs.id, configId),
      eq(deviceConfigs.userId, userId)
    ));

  return getDeviceConfigById(configId, userId);
}

export async function deleteDeviceConfig(configId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.delete(deviceConfigs)
    .where(and(
      eq(deviceConfigs.id, configId),
      eq(deviceConfigs.userId, userId)
    ));

  return result[0].affectedRows > 0;
}

export async function setDefaultConfig(configId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // First, unset all defaults for this user
  await db.update(deviceConfigs)
    .set({ isDefault: false })
    .where(eq(deviceConfigs.userId, userId));

  // Then set the specified config as default
  await db.update(deviceConfigs)
    .set({ isDefault: true })
    .where(and(
      eq(deviceConfigs.id, configId),
      eq(deviceConfigs.userId, userId)
    ));
}

/**
 * Get user's default device config
 * @returns Default DeviceConfig or null if not set/DB unavailable
 */
export async function getDefaultConfig(userId: number): Promise<DeviceConfig | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(deviceConfigs)
    .where(and(
      eq(deviceConfigs.userId, userId),
      eq(deviceConfigs.isDefault, true)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Device Status Log Functions

export async function logDeviceStatus(status: InsertDeviceStatusLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log device status: database not available");
    return;
  }

  await db.insert(deviceStatusLog).values(status);
}

export async function getRecentDeviceStatus(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(deviceStatusLog)
    .where(eq(deviceStatusLog.userId, userId))
    .orderBy(desc(deviceStatusLog.timestamp))
    .limit(limit);
}

// Command History Functions

export async function saveCommandHistory(history: InsertCommandHistory): Promise<CommandHistory | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save command history: database not available");
    return null;
  }

  const result = await db.insert(commandHistory).values(history);
  const insertId = Number(result[0].insertId);
  
  // Return the inserted record
  const inserted = await db.select().from(commandHistory)
    .where(eq(commandHistory.id, insertId))
    .limit(1);
  
  return inserted[0] || null;
}

export async function getCommandHistory(userId: number, limit: number = 50): Promise<CommandHistory[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(commandHistory)
    .where(eq(commandHistory.userId, userId))
    .orderBy(desc(commandHistory.executedAt))
    .limit(limit);
}

export async function getCommandHistoryById(id: number, userId: number): Promise<CommandHistory | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(commandHistory)
    .where(eq(commandHistory.id, id))
    .limit(1);
  
  if (result.length === 0 || result[0].userId !== userId) {
    return null;
  }
  
  return result[0];
}

export async function deleteCommandHistory(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  // Verify ownership before deleting
  const existing = await getCommandHistoryById(id, userId);
  if (!existing) {
    return false;
  }

  await db.delete(commandHistory).where(eq(commandHistory.id, id));
  return true;
}

// User Templates Functions

export async function saveUserTemplate(template: InsertUserTemplate): Promise<UserTemplate | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save user template: database not available");
    return null;
  }

  const result = await db.insert(userTemplates).values(template);
  const insertId = Number(result[0].insertId);
  
  // Return the inserted record
  const inserted = await db.select().from(userTemplates)
    .where(eq(userTemplates.id, insertId))
    .limit(1);
  
  return inserted[0] || null;
}

export async function getUserTemplates(userId: number): Promise<UserTemplate[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(userTemplates)
    .where(eq(userTemplates.userId, userId))
    .orderBy(desc(userTemplates.createdAt));
}

export async function getUserTemplateById(id: number, userId: number): Promise<UserTemplate | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(userTemplates)
    .where(eq(userTemplates.id, id))
    .limit(1);
  
  if (result.length === 0 || result[0].userId !== userId) {
    return null;
  }
  
  return result[0];
}

export async function updateUserTemplate(id: number, userId: number, updates: Partial<InsertUserTemplate>): Promise<UserTemplate | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  // Verify ownership before updating
  const existing = await getUserTemplateById(id, userId);
  if (!existing) {
    return null;
  }

  await db.update(userTemplates)
    .set(updates)
    .where(eq(userTemplates.id, id));
  
  return getUserTemplateById(id, userId);
}

export async function deleteUserTemplate(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  // Verify ownership before deleting
  const existing = await getUserTemplateById(id, userId);
  if (!existing) {
    return false;
  }

  await db.delete(userTemplates).where(eq(userTemplates.id, id));
  return true;
}

export async function incrementTemplateUseCount(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  const template = await getUserTemplateById(id, userId);
  if (!template) {
    return;
  }

  await db.update(userTemplates)
    .set({
      useCount: (template.useCount || 0) + 1,
      lastUsedAt: new Date(),
    })
    .where(eq(userTemplates.id, id));
}

// Template Favorites Functions

export async function addTemplateFavorite(userId: number, templateId?: string, userTemplateId?: number): Promise<TemplateFavorite | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add favorite: database not available");
    return null;
  }

  // Check if already favorited
  const existing = await db.select().from(templateFavorites)
    .where(
      and(
        eq(templateFavorites.userId, userId),
        templateId ? eq(templateFavorites.templateId, templateId) : eq(templateFavorites.userTemplateId, userTemplateId!)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(templateFavorites).values({
    userId,
    templateId,
    userTemplateId,
  });
  
  const insertId = Number(result[0].insertId);
  const inserted = await db.select().from(templateFavorites)
    .where(eq(templateFavorites.id, insertId))
    .limit(1);
  
  return inserted[0] || null;
}

export async function removeTemplateFavorite(userId: number, templateId?: string, userTemplateId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  await db.delete(templateFavorites)
    .where(
      and(
        eq(templateFavorites.userId, userId),
        templateId ? eq(templateFavorites.templateId, templateId) : eq(templateFavorites.userTemplateId, userTemplateId!)
      )
    );
  
  return true;
}

export async function getUserFavorites(userId: number): Promise<TemplateFavorite[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(templateFavorites)
    .where(eq(templateFavorites.userId, userId))
    .orderBy(desc(templateFavorites.createdAt));
}

export async function isTemplateFavorited(userId: number, templateId?: string, userTemplateId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const result = await db.select().from(templateFavorites)
    .where(
      and(
        eq(templateFavorites.userId, userId),
        templateId ? eq(templateFavorites.templateId, templateId) : eq(templateFavorites.userTemplateId, userTemplateId!)
      )
    )
    .limit(1);
  
  return result.length > 0;
}
