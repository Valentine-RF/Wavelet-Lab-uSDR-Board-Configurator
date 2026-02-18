import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import * as streamingDb from "./streamingDb";
import { deviceControl } from "./deviceControl";
import { getStreamingServer } from "./streamingServer";
import { signStreamingToken } from "./_core/streamingAuth";
import {
  MAX_RX_LNA_GAIN, MAX_RX_PGA_GAIN, MAX_RX_VGA_GAIN, MAX_TX_GAIN, MAX_DAC_TUNING,
  MAX_FREQ_HZ, MIN_FREQ_HZ, MAX_BANDWIDTH_HZ, MAX_SAMPLE_RATE_HZ, MAX_BLOCK_SIZE,
  MAX_TAGS_COUNT, MAX_TAG_LENGTH,
} from "./constants";

const deviceConfigSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rfPath: z.string().regex(/^[a-zA-Z0-9_]{1,32}$/).optional(),
  rxCenterFreq: z.number().int().min(MIN_FREQ_HZ).max(MAX_FREQ_HZ),
  txCenterFreq: z.number().int().min(MIN_FREQ_HZ).max(MAX_FREQ_HZ),
  rxBandwidth: z.number().int().positive().max(MAX_BANDWIDTH_HZ),
  txBandwidth: z.number().int().positive().max(MAX_BANDWIDTH_HZ),
  rxLnaGain: z.number().int().min(0).max(MAX_RX_LNA_GAIN),
  rxPgaGain: z.number().int().min(0).max(MAX_RX_PGA_GAIN),
  rxVgaGain: z.number().int().min(0).max(MAX_RX_VGA_GAIN),
  txGain: z.number().int().min(0).max(MAX_TX_GAIN),
  clockSource: z.enum(["internal", "devboard", "external"]),
  externalClockFreq: z.number().int().min(23_000_000).max(41_000_000).optional(),
  dacTuning: z.number().int().min(0).max(MAX_DAC_TUNING).optional(),
  sampleRate: z.number().int().positive().max(MAX_SAMPLE_RATE_HZ),
  dataFormat: z.enum(["ci16", "ci12", "cf32", "cs8", "cs16", "cf32@ci12", "cfftlpwri16"]),
  blockSize: z.number().int().positive().max(MAX_BLOCK_SIZE),
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
  outputPath: z.string().max(512)
    .refine(val => !val.includes('..'), { message: 'Path traversal not allowed' })
    .refine(val => !/[;&|`$(){}[\]<>\\!"'*?~#\n\r]/.test(val), { message: 'Invalid characters in path' })
    .optional(),
});

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
});

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
    // Note: Using publicProcedure since this is a local development tool
    executeCommand: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ input }) => {
        const { spawn, execFileSync } = await import('child_process');

        if (process.env.NODE_ENV === 'production') {
          return {
            success: false as const,
            message: 'Terminal access is disabled in production',
          };
        }

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

        // Helper to check if a terminal exists
        const terminalExists = (name: string): boolean => {
          try {
            execFileSync('which', [name], { stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        };

        // Terminal configurations: [binary, args_before_command]
        const TERMINALS: Array<{ name: string; argsPrefix: string[] }> = [
          { name: 'x-terminal-emulator', argsPrefix: ['-e'] },
          { name: 'gnome-terminal', argsPrefix: ['--'] },
          { name: 'konsole', argsPrefix: ['-e'] },
          { name: 'qterminal', argsPrefix: ['-e'] },
          { name: 'xfce4-terminal', argsPrefix: ['-e'] },
          { name: 'xterm', argsPrefix: ['-hold', '-e'] },
        ];

        // Find available terminal
        const terminal = TERMINALS.find(t => terminalExists(t.name));

        if (!terminal) {
          return {
            success: false,
            message: 'No terminal emulator found. Please install one of: gnome-terminal, konsole, qterminal, xterm'
          };
        }

        try {
          // SECURITY: Pass arguments as array, not as shell string
          const termArgs = [...terminal.argsPrefix, executable, ...args];

          console.log(`[Terminal] Spawning: ${terminal.name} ${termArgs.join(' ')}`);
          console.log(`[Terminal] DISPLAY=${process.env.DISPLAY}`);

          const child = spawn(terminal.name, termArgs, {
            detached: true,
            stdio: 'ignore',
            env: process.env, // Pass environment including DISPLAY for X11
          });

          child.on('error', (err) => {
            console.error(`[Terminal] Failed to spawn ${terminal.name}:`, err.message);
          });

          child.unref();

          return { success: true, message: `Terminal opened successfully (${terminal.name})` };
        } catch (error) {
          return {
            success: false,
            message: `Failed to open terminal: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
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
          rfPath: z.string().regex(/^[a-zA-Z0-9_]{1,32}$/).optional(),
          rxCenterFreq: z.number().int().min(MIN_FREQ_HZ).max(MAX_FREQ_HZ),
          txCenterFreq: z.number().int().min(MIN_FREQ_HZ).max(MAX_FREQ_HZ),
          rxBandwidth: z.number().int().positive().max(MAX_BANDWIDTH_HZ),
          txBandwidth: z.number().int().positive().max(MAX_BANDWIDTH_HZ),
          rxLnaGain: z.number().int().min(0).max(MAX_RX_LNA_GAIN),
          rxPgaGain: z.number().int().min(0).max(MAX_RX_PGA_GAIN),
          rxVgaGain: z.number().int().min(0).max(MAX_RX_VGA_GAIN),
          txGain: z.number().int().min(0).max(MAX_TX_GAIN),
          clockSource: z.enum(["internal", "devboard", "external"]),
          externalClockFreq: z.number().int().min(23_000_000).max(41_000_000).optional(),
          dacTuning: z.number().int().min(0).max(MAX_DAC_TUNING).optional(),
          sampleRate: z.number().int().positive().max(MAX_SAMPLE_RATE_HZ),
          dataFormat: z.enum(["ci16", "ci12", "cf32", "cs8", "cs16", "cf32@ci12", "cfftlpwri16"]),
          blockSize: z.number().int().positive().max(MAX_BLOCK_SIZE),
          connectionType: z.enum(["usb", "pcie"]),
          lnaOn: z.boolean(),
          paOn: z.boolean(),
          gpsdoOn: z.boolean(),
          oscOn: z.boolean(),
          mode: z.enum(["rx", "tx", "trx"]),
          outputMode: z.enum(["websocket", "file", "stdout"]),
          outputPath: z.string().max(512)
            .refine(val => !val.includes('..'), { message: 'Path traversal not allowed' })
            .refine(val => !/[;&|`$(){}[\]<>\\!"'*?~#\n\r]/.test(val), { message: 'Invalid characters in path' })
            .optional(),
          txFile: z.string().max(512)
            .refine(val => !val.includes('..'), { message: 'Path traversal not allowed' })
            .refine(val => !/[;&|`$(){}[\]<>\\!"'*?~#\n\r]/.test(val), { message: 'Invalid characters in path' })
            .optional(),
          loopTx: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Start the stream
          const session = await deviceControl.startStream(ctx.user.id, input.config);

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
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }),

    // Stop a streaming session
    stop: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await deviceControl.stopStream(input.sessionId, ctx.user.id);
          // DB metrics are persisted by the process exit handler in deviceControl
          // to ensure final (not partial) values are written
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to stop stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
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
        if (session.userId !== ctx.user.id) {
          throw new Error('Access denied');
        }
        return session;
      }),

    // List active sessions
    listActive: protectedProcedure.query(async ({ ctx }) => {
      return deviceControl.getActiveSessionsForUser(ctx.user.id);
    }),

    // List user's streaming history
    listHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).optional() }))
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

        const token = await signStreamingToken({
          sessionId: input.sessionId,
          userId: ctx.user.id,
        });

        // Return WebSocket URL with session ID and user ID
        const protocol = ctx.req.protocol === 'https' ? 'wss' : 'ws';
        const host = ctx.req.get('host');
        return {
          url: `${protocol}://${host}/api/stream?sessionId=${input.sessionId}&token=${token}`,
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
      .input(z.object({ limit: z.number().int().min(1).max(200).optional() }))
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
        tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS_COUNT),
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
        tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS_COUNT).optional(),
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
      }).refine(data => data.templateId || data.userTemplateId, {
        message: "Either templateId or userTemplateId must be provided",
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
      }).refine(data => data.templateId || data.userTemplateId, {
        message: "Either templateId or userTemplateId must be provided",
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
      .input(z.object({ limit: z.number().int().min(1).max(200).optional() }))
      .query(async ({ ctx, input }) => {
        return db.getRecentDeviceStatus(ctx.user.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
