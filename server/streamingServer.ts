import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { deviceControl, StreamingSession } from './deviceControl';
import { getStreamingSession } from './streamingDb';
import {
  WS_CLOSE_NORMAL,
  WS_CLOSE_POLICY_VIOLATION,
  WS_CLOSE_INTERNAL_ERROR,
} from './constants';
import { verifyStreamingToken } from './_core/streamingAuth';

export interface StreamClient {
  ws: WebSocket;
  sessionId: string;
  userId: number;
  connectedAt: Date;
  bytesSent: number;
}

/**
 * WebSocket Streaming Server
 * Handles binary I/Q data streaming to connected clients
 */
export class StreamingServer {
  private wss: WebSocketServer;
  private clients: Map<string, StreamClient> = new Map();

  constructor(server: HTTPServer) {
    // Create WebSocket server on /api/stream path
    this.wss = new WebSocketServer({
      server,
      path: '/api/stream',
      maxPayload: 1024, // 1KB - clients only send small control messages
    });

    this.setupWebSocketServer();
    this.setupDeviceControlListeners();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: WebSocket, req) => {
      console.log('[StreamingServer] New WebSocket connection');

      // Extract session ID and token from query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const sessionId = url.searchParams.get('sessionId');
      const token = url.searchParams.get('token');

      if (!sessionId || !token) {
        console.error('[StreamingServer] Missing sessionId or token');
        ws.close(WS_CLOSE_POLICY_VIOLATION, 'Missing sessionId or token');
        return;
      }

      // SECURITY: Verify signed token (binds userId+sessionId and expiration)
      let tokenPayload;
      try {
        tokenPayload = await verifyStreamingToken(token);
      } catch (error) {
        console.error('[StreamingServer] Invalid streaming token:', error);
        ws.close(WS_CLOSE_POLICY_VIOLATION, 'Invalid token');
        return;
      }

      if (tokenPayload.sessionId !== sessionId) {
        console.error('[StreamingServer] Token/sessionId mismatch');
        ws.close(WS_CLOSE_POLICY_VIOLATION, 'Session mismatch');
        return;
      }

      // SECURITY: Verify session exists in database and user owns it
      try {
        const dbSession = await getStreamingSession(sessionId);
        if (!dbSession) {
          console.error(`[StreamingServer] Session ${sessionId} not found in database`);
          ws.close(WS_CLOSE_POLICY_VIOLATION, 'Session not found');
          return;
        }

        // SECURITY: Validate that the claimed userId matches the session owner
        if (dbSession.userId !== tokenPayload.userId) {
          console.error(`[StreamingServer] User ${tokenPayload.userId} attempted to access session owned by ${dbSession.userId}`);
          ws.close(WS_CLOSE_POLICY_VIOLATION, 'Access denied');
          return;
        }
      } catch (error) {
        console.error('[StreamingServer] Database error during session validation:', error);
        ws.close(WS_CLOSE_INTERNAL_ERROR, 'Internal error');
        return;
      }

      // Verify session exists in memory (active streaming)
      const session = deviceControl.getSession(sessionId);
      if (!session) {
        console.error(`[StreamingServer] Session ${sessionId} not found in active sessions`);
        ws.close(WS_CLOSE_POLICY_VIOLATION, 'Session not active');
        return;
      }
      if (session.userId !== tokenPayload.userId) {
        console.error(`[StreamingServer] User ${tokenPayload.userId} attempted to access in-memory session owned by ${session.userId}`);
        ws.close(WS_CLOSE_POLICY_VIOLATION, 'Access denied');
        return;
      }

      // Register client
      const clientId = `${sessionId}-${Date.now()}`;
      const client: StreamClient = {
        ws,
        sessionId,
        userId: tokenPayload.userId,
        connectedAt: new Date(),
        bytesSent: 0,
      };
      this.clients.set(clientId, client);

      console.log(`[StreamingServer] Client ${clientId} connected to session ${sessionId}`);

      // Send initial session info
      ws.send(JSON.stringify({
        type: 'session_info',
        session: {
          sessionId: session.sessionId,
          status: session.status,
          command: session.command,
          config: session.config,
          metrics: session.metrics,
        },
      }));

      // Handle client messages
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('[StreamingServer] Error parsing client message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`[StreamingServer] Client ${clientId} disconnected`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[StreamingServer] WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private setupDeviceControlListeners() {
    // Forward I/Q data to connected clients
    deviceControl.on('data', (sessionId: string, data: Buffer) => {
      this.broadcastToSession(sessionId, data);
    });

    // Send log messages to clients
    deviceControl.on('log', (sessionId: string, message: string) => {
      this.broadcastToSession(sessionId, JSON.stringify({
        type: 'log',
        message,
        timestamp: new Date().toISOString(),
      }));
    });

    // Notify clients of session start
    deviceControl.on('start', (sessionId: string, session: StreamingSession) => {
      this.broadcastToSession(sessionId, JSON.stringify({
        type: 'session_started',
        session: {
          sessionId: session.sessionId,
          status: session.status,
          command: session.command,
          processId: session.processId,
        },
      }));
    });

    // Notify clients of session exit
    deviceControl.on('exit', (sessionId: string, session: StreamingSession) => {
      this.broadcastToSession(sessionId, JSON.stringify({
        type: 'session_ended',
        session: {
          sessionId: session.sessionId,
          status: session.status,
          metrics: session.metrics,
          errorMessage: session.errorMessage,
          errorCode: session.errorCode,
        },
      }));
    });

    // Notify clients of errors
    deviceControl.on('session-error', (sessionId: string, error: Error) => {
      this.broadcastToSession(sessionId, JSON.stringify({
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      }));
    });
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`[StreamingServer] Message from client ${clientId}:`, message.type);

    switch (message.type) {
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'get_metrics':
        const session = deviceControl.getSession(client.sessionId);
        if (session) {
          client.ws.send(JSON.stringify({
            type: 'metrics',
            metrics: session.metrics,
            timestamp: Date.now(),
          }));
        }
        break;

      default:
        console.warn(`[StreamingServer] Unknown message type: ${message.type}`);
    }
  }

  private broadcastToSession(sessionId: string, data: Buffer | string) {
    let sentCount = 0;
    const isBinary = Buffer.isBuffer(data);

    for (const [clientId, client] of Array.from(this.clients.entries())) {
      if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data, { binary: isBinary });
          if (isBinary) {
            client.bytesSent += data.length;
          }
          sentCount++;
        } catch (error) {
          console.error(`[StreamingServer] Error sending to client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    }

    if (sentCount > 0 && isBinary) {
      // console.log(`[StreamingServer] Broadcasted ${data.length} bytes to ${sentCount} clients`);
    }
  }

  /**
   * Get connected clients for a session
   */
  getSessionClients(sessionId: string): StreamClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.sessionId === sessionId
    );
  }

  /**
   * Get all connected clients
   */
  getAllClients(): StreamClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Disconnect a specific client
   */
  disconnectClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.ws.close(WS_CLOSE_NORMAL, 'Server requested disconnect');
      this.clients.delete(clientId);
    }
  }

  /**
   * Disconnect all clients for a session
   */
  disconnectSession(sessionId: string) {
    for (const [clientId, client] of Array.from(this.clients.entries())) {
      if (client.sessionId === sessionId) {
        client.ws.close(WS_CLOSE_NORMAL, 'Session ended');
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    const totalClients = this.clients.size;
    const totalBytesSent = Array.from(this.clients.values()).reduce(
      (sum, client) => sum + client.bytesSent,
      0
    );

    const sessionCounts = new Map<string, number>();
    for (const client of Array.from(this.clients.values())) {
      sessionCounts.set(
        client.sessionId,
        (sessionCounts.get(client.sessionId) || 0) + 1
      );
    }

    return {
      totalClients,
      totalBytesSent,
      sessionCounts: Object.fromEntries(sessionCounts),
      activeSessions: deviceControl.getActiveSessions().length,
    };
  }
}

let streamingServer: StreamingServer | null = null;

/**
 * Initialize streaming server
 */
export function initStreamingServer(httpServer: HTTPServer): StreamingServer {
  if (!streamingServer) {
    streamingServer = new StreamingServer(httpServer);
    console.log('[StreamingServer] Initialized on /api/stream');
  }
  return streamingServer;
}

/**
 * Get streaming server instance
 */
export function getStreamingServer(): StreamingServer | null {
  return streamingServer;
}
