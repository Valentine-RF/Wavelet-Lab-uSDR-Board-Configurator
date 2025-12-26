import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Square, Activity, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// WebSocket connection constants
const WS_RECONNECT_DELAY_MS = 2000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;
const WS_METRICS_INTERVAL_MS = 2000;

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

interface StreamingControlProps {
  config: {
    rfPath?: string;
    rxCenterFreq: number;
    txCenterFreq: number;
    rxBandwidth: number;
    txBandwidth: number;
    rxLnaGain: number;
    rxPgaGain: number;
    rxVgaGain: number;
    txGain: number;
    clockSource: 'internal' | 'devboard' | 'external';
    externalClockFreq?: number;
    dacTuning?: number;
    sampleRate: number;
    dataFormat: string;
    blockSize: number;
    connectionType: 'usb' | 'pcie';
    lnaOn: boolean;
    paOn: boolean;
    gpsdoOn: boolean;
    oscOn: boolean;
    mode: 'rx' | 'tx' | 'trx';
  };
  configId?: number;
}

export function StreamingControl({ config, configId }: StreamingControlProps) {
  const { t } = useLanguage();
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    samplesProcessed: 0,
    bytesTransferred: 0,
    durationSeconds: 0,
    throughputMbps: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsUrlRef = useRef<string | null>(null);

  // Derived state for backwards compatibility
  const wsConnected = connectionState === 'connected';

  const utils = trpc.useUtils();

  const startMutation = trpc.streaming.start.useMutation({
    onSuccess: async (data) => {
      setSessionId(data.sessionId);
      setIsStreaming(true);
      toast.success(t('streaming.started'));

      // Get WebSocket URL and connect
      try {
        const wsData = await utils.streaming.getWebSocketUrl.fetch({ sessionId: data.sessionId });
        connectWebSocket(wsData.url);
      } catch (error) {
        console.error('Failed to get WebSocket URL:', error);
        toast.error(t('streaming.connectFailed'));
      }
    },
    onError: (error) => {
      toast.error(`${t('streaming.startFailed')}: ${error.message}`);
    },
  });

  const stopMutation = trpc.streaming.stop.useMutation({
    onSuccess: () => {
      setIsStreaming(false);
      setSessionId(null);
      setWsConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      toast.success(t('streaming.stopped'));
    },
    onError: (error) => {
      toast.error(`Failed to stop stream: ${error.message}`);
    },
  });

  /**
   * Attempt to reconnect to WebSocket with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (!wsUrlRef.current || !isStreaming) return;

    if (reconnectAttemptsRef.current >= WS_MAX_RECONNECT_ATTEMPTS) {
      setConnectionState('error');
      setConnectionError(`Failed to reconnect after ${WS_MAX_RECONNECT_ATTEMPTS} attempts`);
      toast.error(t('streaming.reconnectFailed') || 'Failed to reconnect to stream');
      return;
    }

    reconnectAttemptsRef.current += 1;
    setConnectionState('reconnecting');

    const delay = WS_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttemptsRef.current - 1);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${WS_MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (wsUrlRef.current) {
        connectWebSocket(wsUrlRef.current);
      }
    }, delay);
  }, [isStreaming]);

  const connectWebSocket = useCallback((url: string) => {
    try {
      // Store URL for reconnection attempts
      wsUrlRef.current = url;
      setConnectionState('connecting');
      setConnectionError(null);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnectionState('connected');
        setConnectionError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
      };

      ws.onmessage = (event) => {
        // Handle different message types
        if (typeof event.data === 'string') {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        } else {
          // Binary data (I/Q samples)
          // In a real application, this would be forwarded to a spectrum analyzer or other processing
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionState('error');
        setConnectionError('Connection error occurred');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason);
        wsRef.current = null;

        // Only attempt reconnection if we're still streaming and it wasn't a clean close
        if (isStreaming && event.code !== 1000 && event.code !== 1001) {
          attemptReconnect();
        } else {
          setConnectionState('disconnected');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setConnectionState('error');
      setConnectionError('Failed to establish connection');
      attemptReconnect();
    }
  }, [isStreaming, attemptReconnect]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'session_info':
        console.log('[WebSocket] Session info:', message.session);
        break;

      case 'session_started':
        console.log('[WebSocket] Session started:', message.session);
        break;

      case 'session_ended':
        console.log('[WebSocket] Session ended:', message.session);
        if (message.session.metrics) {
          setMetrics(message.session.metrics);
        }
        setIsStreaming(false);
        setWsConnected(false);
        break;

      case 'log':
        console.log('[WebSocket] Log:', message.message);
        break;

      case 'error':
        console.error('[WebSocket] Error:', message.error);
        toast.error(`${t('streaming.error')}: ${message.error}`);
        break;

      case 'metrics':
        setMetrics(message.metrics);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Manual reconnect handler
  const handleManualReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    if (wsUrlRef.current) {
      connectWebSocket(wsUrlRef.current);
    }
  }, [connectWebSocket]);

  // Request metrics periodically
  useEffect(() => {
    if (!wsConnected || !wsRef.current) return;

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'get_metrics' }));
      }
    }, WS_METRICS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [wsConnected]);

  // Helper to render connection status
  const renderConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dd-accent-blue)' }}>
            <Wifi className="w-4 h-4" />
            <span>{t('streaming.connected')}</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dd-text-secondary)' }}>
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>{t('streaming.connecting')}</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dd-accent-orange, #f59e0b)' }}>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{t('streaming.reconnecting') || 'Reconnecting...'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dd-accent-red, #ef4444)' }}>
            <AlertCircle className="w-4 h-4" />
            <span>{t('streaming.connectionError') || 'Connection Error'}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualReconnect}
              className="h-6 px-2"
              aria-label="Retry connection"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleStart = () => {
    startMutation.mutate({
      configId,
      config: {
        ...config,
        outputMode: 'websocket',
      },
    });
  };

  const handleStop = () => {
    if (sessionId) {
      stopMutation.mutate({ sessionId });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6" style={{ backgroundColor: 'var(--dd-bg-medium)', borderColor: 'var(--dd-border-default)' }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--dd-font-display)', color: 'var(--dd-text-primary)' }}>
              {t('streaming.title')}
            </h3>
            {isStreaming && renderConnectionStatus()}
          </div>

          <div className="flex items-center gap-2">
            {!isStreaming ? (
              <Button
                onClick={handleStart}
                disabled={startMutation.isPending}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--dd-accent-blue)',
                  color: 'white',
                }}
              >
                <Play className="w-4 h-4" />
                {startMutation.isPending ? t('streaming.starting') : t('streaming.start')}
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                disabled={stopMutation.isPending}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                {stopMutation.isPending ? t('streaming.stopping') : t('streaming.stop')}
              </Button>
            )}
          </div>
        </div>

        {isStreaming && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--dd-border-default)' }}>
            <div>
              <div className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>{t('streaming.duration')}</div>
              <div className="text-lg font-mono" style={{ color: 'var(--dd-text-primary)' }}>
                {formatDuration(metrics.durationSeconds)}
              </div>
            </div>

            <div>
              <div className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>{t('streaming.samples')}</div>
              <div className="text-lg font-mono" style={{ color: 'var(--dd-text-primary)' }}>
                {metrics.samplesProcessed.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>{t('streaming.dataTransferred')}</div>
              <div className="text-lg font-mono" style={{ color: 'var(--dd-text-primary)' }}>
                {formatBytes(metrics.bytesTransferred)}
              </div>
            </div>

            <div>
              <div className="text-sm" style={{ color: 'var(--dd-text-secondary)' }}>{t('streaming.throughput')}</div>
              <div className="text-lg font-mono flex items-center gap-2" style={{ color: 'var(--dd-accent-blue)' }}>
                <Activity className="w-4 h-4" />
                {metrics.throughputMbps} Mbps
              </div>
            </div>
          </div>
        )}

        {connectionError && (
          <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--dd-bg-error, rgba(239, 68, 68, 0.1))', borderColor: 'var(--dd-accent-red, #ef4444)' }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dd-accent-red, #ef4444)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{connectionError}</span>
            </div>
          </div>
        )}

        {sessionId && (
          <div className="pt-4 border-t" style={{ borderColor: 'var(--dd-border-default)' }}>
            <div className="text-xs" style={{ color: 'var(--dd-text-secondary)' }}>
              {t('streaming.sessionId')}: <span className="font-mono">{sessionId}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
