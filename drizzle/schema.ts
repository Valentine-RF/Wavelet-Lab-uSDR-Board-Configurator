import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Device configuration presets table
 * Stores saved configurations for the uSDR Development Board
 */
export const deviceConfigs = mysqlTable("device_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // RF Path
  rfPath: varchar("rfPath", { length: 64 }),
  
  // Frequency Configuration (stored in Hz)
  rxCenterFreq: varchar("rxCenterFreq", { length: 20 }).notNull(),
  txCenterFreq: varchar("txCenterFreq", { length: 20 }).notNull(),
  rxBandwidth: varchar("rxBandwidth", { length: 20 }).notNull(),
  txBandwidth: varchar("txBandwidth", { length: 20 }).notNull(),
  
  // Gain Configuration
  rxLnaGain: int("rxLnaGain").notNull(),
  rxPgaGain: int("rxPgaGain").notNull(),
  rxVgaGain: int("rxVgaGain").notNull(),
  txGain: int("txGain").notNull(),
  
  // Clock Configuration
  clockSource: mysqlEnum("clockSource", ["internal", "devboard", "external"]).notNull(),
  externalClockFreq: varchar("externalClockFreq", { length: 20 }), // in Hz
  dacTuning: int("dacTuning"), // 0-4095
  
  // Sample Rate Configuration
  sampleRate: varchar("sampleRate", { length: 20 }).notNull(), // in Hz
  dataFormat: varchar("dataFormat", { length: 32 }).notNull(),
  blockSize: int("blockSize").notNull(),
  connectionType: mysqlEnum("connectionType", ["usb", "pcie"]).notNull(),
  
  // Device Parameters
  lnaOn: boolean("lnaOn").default(false).notNull(),
  paOn: boolean("paOn").default(false).notNull(),
  gpsdoOn: boolean("gpsdoOn").default(false).notNull(),
  oscOn: boolean("oscOn").default(false).notNull(),
  
  // Operation Mode
  mode: mysqlEnum("mode", ["rx", "tx", "trx"]).default("rx").notNull(),
  
  // Metadata
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeviceConfig = typeof deviceConfigs.$inferSelect;
export type InsertDeviceConfig = typeof deviceConfigs.$inferInsert;

/**
 * Device status log table
 * Tracks connection state and streaming metrics
 */
export const deviceStatusLog = mysqlTable("device_status_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  configId: int("configId"),
  
  // Status Information
  connectionState: mysqlEnum("connectionState", ["connected", "disconnected", "streaming", "error"]).notNull(),
  deviceId: varchar("deviceId", { length: 128 }),
  
  // Streaming Metrics
  throughputMbps: int("throughputMbps"), // Data rate in Mbps
  droppedSamples: int("droppedSamples"),
  errorCount: int("errorCount"),
  
  // Additional Info
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type DeviceStatusLog = typeof deviceStatusLog.$inferSelect;
export type InsertDeviceStatusLog = typeof deviceStatusLog.$inferInsert;

/**
 * Streaming sessions table
 * Tracks active and historical streaming sessions
 */
export const streamingSessions = mysqlTable("streaming_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  configId: int("configId"),
  
  // Session State
  status: mysqlEnum("status", ["starting", "active", "paused", "stopped", "error"]).notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(), // UUID for WebSocket identification
  
  // Process Information
  processId: int("processId"), // OS process ID of usdr_dm_create
  command: text("command"), // Full CLI command executed
  
  // Streaming Configuration
  outputMode: mysqlEnum("outputMode", ["websocket", "file", "stdout"]).notNull(),
  outputPath: text("outputPath"), // File path for file mode
  
  // Runtime Metrics
  samplesProcessed: varchar("samplesProcessed", { length: 20 }), // Total samples
  bytesTransferred: varchar("bytesTransferred", { length: 20 }), // Total bytes
  durationSeconds: int("durationSeconds"),
  averageThroughputMbps: int("averageThroughputMbps"),
  
  // Error Tracking
  errorMessage: text("errorMessage"),
  errorCode: int("errorCode"),
  
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  stoppedAt: timestamp("stoppedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StreamingSession = typeof streamingSessions.$inferSelect;
export type InsertStreamingSession = typeof streamingSessions.$inferInsert;

/**
 * Command execution history table
 * Tracks all commands executed via the dashboard
 */
export const commandHistory = mysqlTable("command_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Command Details
  command: text("command").notNull(), // Full CLI command
  executionMethod: mysqlEnum("executionMethod", ["terminal", "copy", "stream"]).notNull(),
  
  // Configuration Snapshot (JSON)
  configuration: json("configuration"), // Full config state at execution time
  
  // Execution Context
  mode: mysqlEnum("mode", ["rx", "tx", "trx"]).notNull(),
  apiType: mysqlEnum("apiType", ["libusdr", "soapysdr"]).default("libusdr").notNull(),
  rfPath: varchar("rfPath", { length: 64 }),
  centerFrequency: varchar("centerFrequency", { length: 20 }), // Primary frequency
  sampleRate: varchar("sampleRate", { length: 20 }),
  
  // Success/Failure
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
  
  // Timestamps
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type CommandHistory = typeof commandHistory.$inferSelect;
export type InsertCommandHistory = typeof commandHistory.$inferInsert;

/**
 * User custom templates table
 * Stores user-created configuration templates
 */
export const userTemplates = mysqlTable("user_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Template Metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["monitoring", "testing", "analysis", "communication"]).notNull(),
  tags: json("tags"), // Array of tag strings
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate").notNull(),
  
  // Template Parameters (stored as JSON for flexibility)
  parameters: json("parameters").notNull(), // Full configuration object
  
  // Generated Command
  command: text("command").notNull(),
  
  // Usage Statistics
  useCount: int("useCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTemplate = typeof userTemplates.$inferSelect;
export type InsertUserTemplate = typeof userTemplates.$inferInsert;

/**
 * Template favorites table
 * Tracks which templates users have favorited (both built-in and custom)
 */
export const templateFavorites = mysqlTable("template_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Template Reference
  // For built-in templates: use templateId (string like "wifi_monitor")
  // For custom templates: use userTemplateId (integer)
  templateId: varchar("templateId", { length: 255 }), // Built-in template ID
  userTemplateId: int("userTemplateId"), // Custom template ID
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateFavorite = typeof templateFavorites.$inferSelect;
export type InsertTemplateFavorite = typeof templateFavorites.$inferInsert;
