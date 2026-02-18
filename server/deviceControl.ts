import { spawn, ChildProcess } from 'child_process';
import { nanoid } from 'nanoid';
import { EventEmitter } from 'events';
import path from 'path';
import {
  ONE_SECOND_MS,
  METRICS_UPDATE_INTERVAL_MS,
  BITS_PER_BYTE,
  BITS_PER_MEGABIT,
} from './constants';
import * as streamingDb from './streamingDb';

// SECURITY: Path validation utilities
const SHELL_METACHARACTERS = /[;&|`$(){}[\]<>\\!"'*?~#\n\r]/;
const ALLOWED_OUTPUT_DIRECTORIES = ['/tmp', '/var/lib/usdr', '/home'];

/**
 * Validates a file path for security
 * @throws Error if path is invalid or potentially malicious
 */
function validateFilePath(filePath: string, allowedDirs: string[] = ALLOWED_OUTPUT_DIRECTORIES): string {
  // Check for shell metacharacters
  if (SHELL_METACHARACTERS.test(filePath)) {
    throw new Error('Invalid characters in file path');
  }

  // Normalize and resolve path to catch traversal attempts
  const normalizedPath = path.normalize(filePath);
  const resolvedPath = path.resolve(normalizedPath);

  // Detect path traversal (.. components that escape)
  if (normalizedPath !== filePath && filePath.includes('..')) {
    throw new Error('Path traversal detected');
  }

  // Ensure path is within allowed directories
  const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(dir));
  if (!isAllowed && !resolvedPath.startsWith('/dev/')) {
    throw new Error(`File path must be within allowed directories: ${allowedDirs.join(', ')}`);
  }

  return resolvedPath;
}

/**
 * Validates a string value contains no shell metacharacters
 */
function validateSafeString(value: string, fieldName: string): string {
  if (SHELL_METACHARACTERS.test(value)) {
    throw new Error(`Invalid characters in ${fieldName}`);
  }
  return value;
}

export interface UsdrConfig {
  // RF Path
  rfPath?: string;
  
  // Frequency Configuration (in Hz)
  rxCenterFreq: number;
  txCenterFreq: number;
  rxBandwidth: number;
  txBandwidth: number;
  
  // Gain Configuration
  rxLnaGain: number;
  rxPgaGain: number;
  rxVgaGain: number;
  txGain: number;
  
  // Clock Configuration
  clockSource: 'internal' | 'devboard' | 'external';
  externalClockFreq?: number;
  dacTuning?: number;
  
  // Sample Rate Configuration
  sampleRate: number;
  dataFormat: string;
  blockSize: number;
  connectionType: 'usb' | 'pcie';
  
  // Device Parameters
  lnaOn: boolean;
  paOn: boolean;
  gpsdoOn: boolean;
  oscOn: boolean;
  
  // Operation Mode
  mode: 'rx' | 'tx' | 'trx';
  
  // Output configuration
  outputMode: 'websocket' | 'file' | 'stdout';
  outputPath?: string;
  
  // Optional TX file for replay
  txFile?: string;
  loopTx?: boolean;
}

export interface StreamMetrics {
  samplesProcessed: number;
  bytesTransferred: number;
  durationSeconds: number;
  throughputMbps: number;
  droppedSamples: number;
  errorCount: number;
}

export interface StreamingSession {
  userId: number;
  sessionId: string;
  processId: number | undefined;
  status: 'starting' | 'active' | 'paused' | 'stopped' | 'error';
  config: UsdrConfig;
  command: string;
  metrics: StreamMetrics;
  errorMessage?: string;
  errorCode?: number;
  startTime: Date;
  stopTime?: Date;
}

/**
 * Device Control Service
 * Manages usdr_dm_create process lifecycle and streaming sessions
 */
export class DeviceControlService extends EventEmitter {
  private sessions: Map<string, StreamingSession> = new Map();
  private processes: Map<string, ChildProcess> = new Map();

  constructor() {
    super();
  }

  /**
   * Build usdr_dm_create command from configuration
   * SECURITY: Returns separate args array for spawn() and command string for logging
   * All user-provided paths are validated before use
   */
  private buildCommand(config: UsdrConfig): { args: string[], commandString: string } {
    const args: string[] = [];

    // Sample rate (numeric, safe)
    args.push('-r', String(config.sampleRate));

    // Data format - SECURITY: validate against allowed formats
    const allowedFormats = ['ci16', 'ci12', 'cf32', 'cs8', 'cs16', 'cf32@ci12', 'cfftlpwri16'];
    const dataFormat = validateSafeString(config.dataFormat, 'dataFormat');
    if (!allowedFormats.includes(dataFormat)) {
      throw new Error(`Invalid data format: ${dataFormat}`);
    }
    args.push('-F', dataFormat);

    // Block size (numeric, safe)
    args.push('-S', String(config.blockSize));
    args.push('-O', String(config.blockSize));

    // Continuous streaming
    args.push('-c', '-1');

    // Mode-specific configuration
    if (config.mode === 'rx') {
      // RX only (numeric values, safe)
      args.push('-e', String(config.rxCenterFreq));
      args.push('-w', String(config.rxBandwidth));

      // Output - SECURITY: validate file paths
      if (config.outputMode === 'stdout') {
        args.push('-f', '/dev/stdout');
      } else if (config.outputMode === 'file' && config.outputPath) {
        const validatedPath = validateFilePath(config.outputPath);
        args.push('-f', validatedPath);
      } else if (config.outputMode === 'websocket') {
        args.push('-f', '/dev/stdout');
      }
    } else if (config.mode === 'tx') {
      // TX only
      args.push('-t');
      args.push('-E', String(config.txCenterFreq));
      args.push('-W', String(config.txBandwidth));

      // SECURITY: validate TX file path
      if (config.txFile) {
        const validatedTxFile = validateFilePath(config.txFile);
        args.push('-I', validatedTxFile);
        if (config.loopTx) {
          args.push('-o');
        }
      }
    } else if (config.mode === 'trx') {
      // TX + RX
      args.push('-T');
      args.push('-e', String(config.rxCenterFreq));
      args.push('-E', String(config.txCenterFreq));
      args.push('-w', String(config.rxBandwidth));
      args.push('-W', String(config.txBandwidth));

      // SECURITY: validate output file path
      if (config.outputMode === 'stdout') {
        args.push('-f', '/dev/stdout');
      } else if (config.outputMode === 'file' && config.outputPath) {
        const validatedPath = validateFilePath(config.outputPath);
        args.push('-f', validatedPath);
      } else if (config.outputMode === 'websocket') {
        args.push('-f', '/dev/stdout');
      }

      // SECURITY: validate TX file path
      if (config.txFile) {
        const validatedTxFile = validateFilePath(config.txFile);
        args.push('-I', validatedTxFile);
        if (config.loopTx) {
          args.push('-o');
        }
      }
    }

    // Gain configuration (numeric, safe)
    args.push('-y', String(config.rxLnaGain));
    args.push('-u', String(config.rxPgaGain));
    args.push('-U', String(config.rxVgaGain));
    args.push('-Y', String(config.txGain));

    // Clock configuration
    if (config.clockSource === 'external' && config.externalClockFreq) {
      args.push('-a', 'external');
      args.push('-x', String(config.externalClockFreq));
    } else if (config.clockSource === 'devboard') {
      args.push('-a', 'internal');
    } else {
      args.push('-a', 'internal');
    }

    // Device parameters (-D)
    const deviceParams: string[] = [];

    // Connection type
    if (config.connectionType === 'pcie') {
      deviceParams.push('bus=pci');
    } else {
      deviceParams.push('bus=usb');
    }

    // Front-end configuration
    const feParams: string[] = ['pciefev1'];

    // SECURITY: validate RF path against allowed patterns
    if (config.rfPath) {
      const rfPathPattern = /^trx[a-z0-9_]+$/i;
      if (!rfPathPattern.test(config.rfPath)) {
        throw new Error('Invalid RF path format');
      }
      feParams.push(`path_${config.rfPath}`);
    }

    if (config.lnaOn) {
      feParams.push('lna_on');
    }

    if (config.paOn) {
      feParams.push('pa_on');
    }

    if (config.gpsdoOn) {
      feParams.push('gpsdo_on');
    }

    if (config.oscOn) {
      feParams.push('osc_on');
    }

    if (config.dacTuning !== undefined) {
      feParams.push(`dac_${config.dacTuning}`);
    }

    deviceParams.push(`fe=${feParams.join(':')}`);

    if (deviceParams.length > 0) {
      args.push('-D', deviceParams.join(','));
    }

    // Build command string for logging (not used for execution)
    const commandString = `usdr_dm_create ${args.join(' ')}`;

    return { args, commandString };
  }

  /**
   * Start a new streaming session
   */
  async startStream(userId: number, config: UsdrConfig): Promise<StreamingSession> {
    const sessionId = nanoid();
    // SECURITY: buildCommand now returns validated args array and command string separately
    const { args, commandString } = this.buildCommand(config);

    const session: StreamingSession = {
      userId,
      sessionId,
      processId: undefined,
      status: 'starting',
      config,
      command: commandString, // Use command string for logging/display only
      metrics: {
        samplesProcessed: 0,
        bytesTransferred: 0,
        durationSeconds: 0,
        throughputMbps: 0,
        droppedSamples: 0,
        errorCount: 0,
      },
      startTime: new Date(),
    };

    this.sessions.set(sessionId, session);

    try {
      // SECURITY: Use pre-validated args array directly - no string parsing needed
      // Spawn the process with usdr_dm_create as executable
      const process = spawn('usdr_dm_create', args, {
        stdio: config.outputMode === 'websocket' ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'pipe'],
      });

      session.processId = process.pid;
      session.status = 'active';
      this.processes.set(sessionId, process);

      // Handle stdout (I/Q data stream)
      if (config.outputMode === 'websocket' && process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          session.metrics.bytesTransferred += data.length;
          // Calculate samples based on format
          const bytesPerSample = config.dataFormat === 'ci16' ? 4 : 8;
          session.metrics.samplesProcessed += Math.floor(data.length / bytesPerSample);
          
          // Emit data event for WebSocket forwarding
          this.emit('data', sessionId, data);
        });
      }

      // Handle stderr (logs and errors)
      if (process.stderr) {
        process.stderr.on('data', (data: Buffer) => {
          const message = data.toString();
          this.emit('log', sessionId, message);
          
          // Parse for errors
          if (message.toLowerCase().includes('error')) {
            session.metrics.errorCount++;
          }
        });
      }

      // Handle process exit
      process.on('exit', (code, signal) => {
        session.status = code === 0 ? 'stopped' : 'error';
        session.stopTime = new Date();
        session.metrics.durationSeconds = Math.floor(
          (session.stopTime.getTime() - session.startTime.getTime()) / ONE_SECOND_MS
        );
        
        if (code !== 0) {
          session.errorCode = code || undefined;
          session.errorMessage = `Process exited with code ${code}, signal ${signal}`;
        }

        // Calculate average throughput
        if (session.metrics.durationSeconds > 0) {
          session.metrics.throughputMbps = Math.floor(
            (session.metrics.bytesTransferred * BITS_PER_BYTE) / (session.metrics.durationSeconds * BITS_PER_MEGABIT)
          );
        }

        this.processes.delete(sessionId);
        this.emit('exit', sessionId, session);

        // Persist final status to database (best effort)
        const persist = session.status === 'error' && session.errorMessage
          ? streamingDb.markSessionError(sessionId, session.errorMessage, session.errorCode)
          : streamingDb.stopStreamingSession(sessionId, {
              samplesProcessed: session.metrics.samplesProcessed.toString(),
              bytesTransferred: session.metrics.bytesTransferred.toString(),
              durationSeconds: session.metrics.durationSeconds,
              averageThroughputMbps: session.metrics.throughputMbps,
            });

        void persist.catch((err) => {
          console.error('[DeviceControl] Failed to persist session state:', err);
        });
      });

      // Handle process errors
      process.on('error', (error) => {
        session.status = 'error';
        session.errorMessage = error.message;
        this.emit('session-error', sessionId, error);

        // Persist error status to database (best effort)
        void streamingDb.markSessionError(sessionId, error.message).catch((err) => {
          console.error('[DeviceControl] Failed to persist error state:', err);
        });
      });

      this.emit('start', sessionId, session);
      return session;
    } catch (error) {
      session.status = 'error';
      session.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('session-error', sessionId, error);
      throw error;
    }
  }

  /**
   * Stop a streaming session
   */
  async stopStream(sessionId: string, userId?: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (userId !== undefined && session.userId !== userId) {
      throw new Error('Access denied');
    }

    const process = this.processes.get(sessionId);
    if (process) {
      // Send SIGTERM for graceful shutdown
      process.kill('SIGTERM');

      // Wait for process to exit, or force kill after timeout
      const killTimer = setTimeout(() => {
        try {
          // signal 0 checks if process is still running without sending a signal
          process.kill(0);
          // Process still alive — force kill
          process.kill('SIGKILL');
        } catch {
          // Process already exited, no action needed
        }
      }, METRICS_UPDATE_INTERVAL_MS);

      process.on('exit', () => clearTimeout(killTimer));
    }

    session.status = 'stopped';
    session.stopTime = new Date();
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): StreamingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): StreamingSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'active' || s.status === 'starting'
    );
  }

  /**
   * Get all active sessions for a user
   */
  getActiveSessionsForUser(userId: number): StreamingSession[] {
    return this.getActiveSessions().filter((s) => s.userId === userId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): StreamingSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up stopped sessions
   */
  cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.processes.delete(sessionId);
  }
}

// Singleton instance
export const deviceControl = new DeviceControlService();
