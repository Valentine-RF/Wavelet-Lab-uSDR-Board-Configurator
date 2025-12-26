import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as streamingDb from "./streamingDb";
import { deviceControl } from "./deviceControl";
import { getStreamingServer } from "./streamingServer";

const deviceConfigSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rfPath: z.string().optional(),
  rxCenterFreq: z.number().int().positive(),
  txCenterFreq: z.number().int().positive(),
  rxBandwidth: z.number().int().positive(),
  txBandwidth: z.number().int().positive(),
  rxLnaGain: z.number().int().min(0).max(30),
  rxPgaGain: z.number().int().min(0).max(19),
  rxVgaGain: z.number().int().min(0).max(15),
  txGain: z.number().int().min(0).max(89),
  clockSource: z.enum(["internal", "devboard", "external"]),
  externalClockFreq: z.number().int().optional(),
  dacTuning: z.number().int().min(0).max(4095).optional(),
  sampleRate: z.number().int().positive(),
  dataFormat: z.string(),
  blockSize: z.number().int().positive(),
  connectionType: z.enum(["usb", "pcie"]),
  lnaOn: z.boolean(),
  paOn: z.boolean(),
  gpsdoOn: z.boolean(),
  oscOn: z.boolean(),
  mode: z.enum(["rx", "tx", "trx"]),
});

// Schema for command history configuration snapshot
const commandConfigurationSchema = z.object({
  rfPath: z.string().optional(),
  rxCenterFreq: z.number().optional(),
  txCenterFreq: z.number().optional(),
  rxBandwidth: z.number().optional(),
  txBandwidth: z.number().optional(),
  rxLnaGain: z.number().optional(),
  rxPgaGain: z.number().optional(),
  rxVgaGain: z.number().optional(),
  txGain: z.number().optional(),
  clockSource: z.string().optional(),
  sampleRate: z.number().optional(),
  dataFormat: z.string().optional(),
  blockSize: z.number().optional(),
  connectionType: z.string().optional(),
  lnaOn: z.boolean().optional(),
  paOn: z.boolean().optional(),
  gpsdoOn: z.boolean().optional(),
  oscOn: z.boolean().optional(),
  mode: z.string().optional(),
  outputMode: z.string().optional(),
  outputPath: z.string().optional(),
}).passthrough(); // Allow additional fields for flexibility

// Schema for user template parameters
const templateParametersSchema = z.object({
  rfPath: z.string().optional(),
  rxCenterFreq: z.number().optional(),
  txCenterFreq: z.number().optional(),
  rxBandwidth: z.number().optional(),
  txBandwidth: z.number().optional(),
  rxLnaGain: z.number().optional(),
  rxPgaGain: z.number().optional(),
  rxVgaGain: z.number().optional(),
  txGain: z.number().optional(),
  clockSource: z.string().optional(),
  sampleRate: z.number().optional(),
  dataFormat: z.string().optional(),
  blockSize: z.number().optional(),
  connectionType: z.string().optional(),
  lnaOn: z.boolean().optional(),
  paOn: z.boolean().optional(),
  gpsdoOn: z.boolean().optional(),
  oscOn: z.boolean().optional(),
  mode: z.string().optional(),
}).passthrough(); // Allow additional template-specific fields

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  terminal: router({
    // Execute command in a new terminal
    // SECURITY: Only allows whitelisted commands (usdr_dm_create) with validated parameters
    executeCommand: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ input }) => {
        const { spawn } = await import('child_process');

        // SECURITY: Whitelist of allowed commands
        const ALLOWED_COMMANDS = ['usdr_dm_create'];

        // Parse command to extract executable and arguments
        const trimmedCommand = input.command.trim();
        const parts = trimmedCommand.split(/\s+/);
        const executable = parts[0];

        // SECURITY: Validate command is in whitelist
        if (!ALLOWED_COMMANDS.includes(executable)) {
          return {
            success: false,
            message: `Command not allowed. Only the following commands are permitted: ${ALLOWED_COMMANDS.join(', ')}`
          };
        }

        // SECURITY: Validate no shell metacharacters in arguments
        const shellMetacharacters = /[;&|`$(){}[\]<>\\!"'*?~#]/;
        const args = parts.slice(1);
        for (const arg of args) {
          if (shellMetacharacters.test(arg)) {
            return {
              success: false,
              message: 'Invalid characters detected in command arguments'
            };
          }
        }

        // Spawn a new terminal with the validated command
        // Using gnome-terminal for Linux environments
        try {
          // SECURITY: Pass arguments as array, not as shell string
          spawn('gnome-terminal', ['--', executable, ...args], {
            detached: true,
            stdio: 'ignore'
          }).unref();

          return { success: true, message: 'Terminal opened successfully' };
        } catch (error) {
          // Fallback: try xterm
          try {
            spawn('xterm', ['-hold', '-e', executable, ...args], {
              detached: true,
              stdio: 'ignore'
            }).unref();
            return { success: true, message: 'Terminal opened successfully' };
          } catch (xterError) {
            return {
              success: false,
              message: 'No terminal emulator found. Please install gnome-terminal or xterm.'
            };
          }
        }
      }),
  }),

  deviceConfig: router({
    // List all configurations for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDeviceConfigs(ctx.user.id);
    }),

    // Get a specific configuration
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDeviceConfigById(input.id, ctx.user.id);
      }),

    // Get the default configuration
    getDefault: protectedProcedure.query(async ({ ctx }) => {
      return db.getDefaultConfig(ctx.user.id);
    }),

    // Create a new configuration
    create: protectedProcedure
      .input(deviceConfigSchema)
      .mutation(async ({ ctx, input }) => {
        return db.createDeviceConfig({
          ...input,
          rxCenterFreq: input.rxCenterFreq.toString(),
          txCenterFreq: input.txCenterFreq.toString(),
          rxBandwidth: input.rxBandwidth.toString(),
          txBandwidth: input.txBandwidth.toString(),
          externalClockFreq: input.externalClockFreq?.toString(),
          sampleRate: input.sampleRate.toString(),
          userId: ctx.user.id,
        });
      }),

    // Update an existing configuration
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: deviceConfigSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert numeric fields to strings for database storage
        const updates: Record<string, string | number | boolean | undefined> = { ...input.data };
        if (updates.rxCenterFreq !== undefined) updates.rxCenterFreq = updates.rxCenterFreq.toString();
        if (updates.txCenterFreq !== undefined) updates.txCenterFreq = updates.txCenterFreq.toString();
        if (updates.rxBandwidth !== undefined) updates.rxBandwidth = updates.rxBandwidth.toString();
        if (updates.txBandwidth !== undefined) updates.txBandwidth = updates.txBandwidth.toString();
        if (updates.externalClockFreq !== undefined) updates.externalClockFreq = updates.externalClockFreq.toString();
        if (updates.sampleRate !== undefined) updates.sampleRate = updates.sampleRate.toString();
        return db.updateDeviceConfig(input.id, ctx.user.id, updates);
      }),

    // Delete a configuration
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteDeviceConfig(input.id, ctx.user.id);
      }),

    // Set a configuration as default
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setDefaultConfig(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  streaming: router({    // Start a new streaming session
    start: protectedProcedure
      .input(z.object({
        configId: z.number().optional(),
        config: z.object({
          rfPath: z.string().optional(),
          rxCenterFreq: z.number().int().positive(),
          txCenterFreq: z.number().int().positive(),
          rxBandwidth: z.number().int().positive(),
          txBandwidth: z.number().int().positive(),
          rxLnaGain: z.number().int().min(0).max(30),
          rxPgaGain: z.number().int().min(0).max(19),
          rxVgaGain: z.number().int().min(0).max(15),
          txGain: z.number().int().min(0).max(89),
          clockSource: z.enum(["internal", "devboard", "external"]),
          externalClockFreq: z.number().int().optional(),
          dacTuning: z.number().int().min(0).max(4095).optional(),
          sampleRate: z.number().int().positive(),
          dataFormat: z.string(),
          blockSize: z.number().int().positive(),
          connectionType: z.enum(["usb", "pcie"]),
          lnaOn: z.boolean(),
          paOn: z.boolean(),
          gpsdoOn: z.boolean(),
          oscOn: z.boolean(),
          mode: z.enum(["rx", "tx", "trx"]),
          outputMode: z.enum(["websocket", "file", "stdout"]),
          outputPath: z.string().optional(),
          txFile: z.string().optional(),
          loopTx: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Start the stream
          const session = await deviceControl.startStream(input.config);

          // Save to database
          await streamingDb.createStreamingSession({
            userId: ctx.user.id,
            configId: input.configId,
            status: session.status,
            sessionId: session.sessionId,
            processId: session.processId,
            command: session.command,
            outputMode: input.config.outputMode,
            outputPath: input.config.outputPath,
          });

          return {
            success: true,
            sessionId: session.sessionId,
            command: session.command,
            processId: session.processId,
          };
        } catch (error) {
          throw new Error(`Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),

    // Stop a streaming session
    stop: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await deviceControl.stopStream(input.sessionId);
          const session = deviceControl.getSession(input.sessionId);

          if (session) {
            // Update database
            await streamingDb.stopStreamingSession(input.sessionId, {
              samplesProcessed: session.metrics.samplesProcessed.toString(),
              bytesTransferred: session.metrics.bytesTransferred.toString(),
              durationSeconds: session.metrics.durationSeconds,
              averageThroughputMbps: session.metrics.throughputMbps,
            });
          }

          return { success: true };
        } catch (error) {
          throw new Error(`Failed to stop stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),

    // Get session status
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        const session = deviceControl.getSession(input.sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        return session;
      }),

    // List active sessions
    listActive: protectedProcedure.query(async ({ ctx }) => {
      return deviceControl.getActiveSessions();
    }),

    // List user's streaming history
    listHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return streamingDb.getUserStreamingSessions(ctx.user.id, input.limit);
      }),

    // Get streaming server stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const server = getStreamingServer();
      if (!server) {
        return { error: 'Streaming server not initialized' };
      }
      return server.getStats();
    }),

    // Get WebSocket URL for streaming
    getWebSocketUrl: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Verify session exists and belongs to user
        const dbSession = await streamingDb.getStreamingSession(input.sessionId);
        if (!dbSession || dbSession.userId !== ctx.user.id) {
          throw new Error('Session not found or access denied');
        }

        // Return WebSocket URL with session ID and user ID
        const protocol = ctx.req.protocol === 'https' ? 'wss' : 'ws';
        const host = ctx.req.get('host');
        return {
          url: `${protocol}://${host}/api/stream?sessionId=${input.sessionId}&userId=${ctx.user.id}`,
        };
      }),
  }),

  commandHistory: router({
    // Save command to history
    save: protectedProcedure
      .input(z.object({
        command: z.string(),
        executionMethod: z.enum(["terminal", "copy", "stream"]),
        configuration: commandConfigurationSchema.optional(),
        mode: z.enum(["rx", "tx", "trx"]),
        apiType: z.enum(["libusdr", "soapysdr"]).optional(),
        rfPath: z.string().optional(),
        centerFrequency: z.string().optional(),
        sampleRate: z.string().optional(),
        success: z.boolean().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const history = await db.saveCommandHistory({
          ...input,
          userId: ctx.user.id,
          success: input.success ?? true,
        });
        return history;
      }),

    // Get command history
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getCommandHistory(ctx.user.id, input.limit);
      }),

    // Get single command by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCommandHistoryById(input.id, ctx.user.id);
      }),

    // Delete command from history
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteCommandHistory(input.id, ctx.user.id);
        return { success };
      }),
  }),

  userTemplates: router({
    // Save new user template
    save: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().min(1),
        category: z.enum(["monitoring", "testing", "analysis", "communication"]),
        tags: z.array(z.string()),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        parameters: templateParametersSchema,
        command: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.saveUserTemplate({
          ...input,
          userId: ctx.user.id,
          difficulty: input.difficulty || "intermediate",
        });
        return template;
      }),

    // Get all user templates
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserTemplates(ctx.user.id);
      }),

    // Get single template by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getUserTemplateById(input.id, ctx.user.id);
      }),

    // Update template
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        category: z.enum(["monitoring", "testing", "analysis", "communication"]).optional(),
        tags: z.array(z.string()).optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        parameters: templateParametersSchema.optional(),
        command: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return db.updateUserTemplate(id, ctx.user.id, updates);
      }),

    // Delete template
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteUserTemplate(input.id, ctx.user.id);
        return { success };
      }),

    // Increment use count
    incrementUseCount: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.incrementTemplateUseCount(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  templateFavorites: router({
    // Add template to favorites
    add: protectedProcedure
      .input(z.object({
        templateId: z.string().optional(),
        userTemplateId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const favorite = await db.addTemplateFavorite(
          ctx.user.id,
          input.templateId,
          input.userTemplateId
        );
        return favorite;
      }),

    // Remove template from favorites
    remove: protectedProcedure
      .input(z.object({
        templateId: z.string().optional(),
        userTemplateId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.removeTemplateFavorite(
          ctx.user.id,
          input.templateId,
          input.userTemplateId
        );
        return { success };
      }),

    // Get all user favorites
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserFavorites(ctx.user.id);
      }),

    // Check if template is favorited
    check: protectedProcedure
      .input(z.object({
        templateId: z.string().optional(),
        userTemplateId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const isFavorited = await db.isTemplateFavorited(
          ctx.user.id,
          input.templateId,
          input.userTemplateId
        );
        return { isFavorited };
      }),
  }),

  deviceStatus: router({
    // Log device status
    log: protectedProcedure
      .input(z.object({
        configId: z.number().optional(),
        connectionState: z.enum(["connected", "disconnected", "streaming", "error"]),
        deviceId: z.string().optional(),
        throughputMbps: z.number().optional(),
        droppedSamples: z.number().optional(),
        errorCount: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.logDeviceStatus({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),

    // Get recent status logs
    recent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getRecentDeviceStatus(ctx.user.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;

