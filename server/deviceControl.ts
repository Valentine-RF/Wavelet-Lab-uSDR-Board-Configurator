import { spawn, ChildProcess } from 'child_process';
import { nanoid } from 'nanoid';
import { EventEmitter } from 'events';

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

  /**
   * Build usdr_dm_create command from configuration
   */
  private buildCommand(config: UsdrConfig): string {
    const args: string[] = ['usdr_dm_create'];

    // Sample rate
    args.push(`-r ${config.sampleRate}`);

    // Data format
    args.push(`-F ${config.dataFormat}`);

    // Block size
    args.push(`-S ${config.blockSize}`);
    args.push(`-O ${config.blockSize}`);

    // Continuous streaming
    args.push('-c -1');

    // Mode-specific configuration
    if (config.mode === 'rx') {
      // RX only
      args.push(`-e ${config.rxCenterFreq}`);
      args.push(`-w ${config.rxBandwidth}`);
      
      // Output
      if (config.outputMode === 'stdout') {
        args.push('-f /dev/stdout');
      } else if (config.outputMode === 'file' && config.outputPath) {
        args.push(`-f ${config.outputPath}`);
      } else if (config.outputMode === 'websocket') {
        args.push('-f /dev/stdout');
      }
    } else if (config.mode === 'tx') {
      // TX only
      args.push('-t');
      args.push(`-E ${config.txCenterFreq}`);
      args.push(`-W ${config.txBandwidth}`);
      
      if (config.txFile) {
        args.push(`-I ${config.txFile}`);
        if (config.loopTx) {
          args.push('-o');
        }
      }
    } else if (config.mode === 'trx') {
      // TX + RX
      args.push('-T');
      args.push(`-e ${config.rxCenterFreq}`);
      args.push(`-E ${config.txCenterFreq}`);
      args.push(`-w ${config.rxBandwidth}`);
      args.push(`-W ${config.txBandwidth}`);
      
      if (config.outputMode === 'stdout') {
        args.push('-f /dev/stdout');
      } else if (config.outputMode === 'file' && config.outputPath) {
        args.push(`-f ${config.outputPath}`);
      } else if (config.outputMode === 'websocket') {
        args.push('-f /dev/stdout');
      }
      
      if (config.txFile) {
        args.push(`-I ${config.txFile}`);
        if (config.loopTx) {
          args.push('-o');
        }
      }
    }

    // Gain configuration
    args.push(`-y ${config.rxLnaGain}`);
    args.push(`-u ${config.rxPgaGain}`);
    args.push(`-U ${config.rxVgaGain}`);
    args.push(`-Y ${config.txGain}`);

    // Clock configuration
    if (config.clockSource === 'external' && config.externalClockFreq) {
      args.push('-a external');
      args.push(`-x ${config.externalClockFreq}`);
    } else if (config.clockSource === 'devboard') {
      args.push('-a internal');
    } else {
      args.push('-a internal');
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
    
    if (config.rfPath) {
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
      args.push(`-D ${deviceParams.join(',')}`);
    }

    return args.join(' ');
  }

  /**
   * Start a new streaming session
   */
  async startStream(config: UsdrConfig): Promise<StreamingSession> {
    const sessionId = nanoid();
    const command = this.buildCommand(config);

    const session: StreamingSession = {
      sessionId,
      processId: undefined,
      status: 'starting',
      config,
      command,
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
      // Parse command into executable and args
      const cmdParts = command.split(' ');
      const executable = cmdParts[0];
      const args = cmdParts.slice(1);

      // Spawn the process
      const process = spawn(executable, args, {
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
          (session.stopTime.getTime() - session.startTime.getTime()) / 1000
        );
        
        if (code !== 0) {
          session.errorCode = code || undefined;
          session.errorMessage = `Process exited with code ${code}, signal ${signal}`;
        }

        // Calculate average throughput
        if (session.metrics.durationSeconds > 0) {
          session.metrics.throughputMbps = Math.floor(
            (session.metrics.bytesTransferred * 8) / (session.metrics.durationSeconds * 1000000)
          );
        }

        this.processes.delete(sessionId);
        this.emit('exit', sessionId, session);
      });

      // Handle process errors
      process.on('error', (error) => {
        session.status = 'error';
        session.errorMessage = error.message;
        this.emit('error', sessionId, error);
      });

      this.emit('start', sessionId, session);
      return session;
    } catch (error) {
      session.status = 'error';
      session.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', sessionId, error);
      throw error;
    }
  }

  /**
   * Stop a streaming session
   */
  async stopStream(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const process = this.processes.get(sessionId);
    if (process && !process.killed) {
      // Send SIGTERM for graceful shutdown
      process.kill('SIGTERM');
      
      // Wait for process to exit, or force kill after 5 seconds
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);
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
