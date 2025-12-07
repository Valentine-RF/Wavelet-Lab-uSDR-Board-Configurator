# Technical Specifications - gRPC Dashboard Implementation

## CRITICAL PERFORMANCE RULES

### ❌ DO NOT DO THIS
```typescript
// WRONG - Storing FFT data in React state causes re-renders
const [fftData, setFftData] = useState<Float32Array>(new Float32Array(1024));

// WRONG - setInterval is not synchronized with display refresh
setInterval(() => updateWaterfall(), 50);

// WRONG - Storing high-frequency data in state
const [samples, setSamples] = useState<number[]>([]);
```

### ✅ DO THIS
```typescript
// CORRECT - Use useRef for high-frequency data (no re-renders)
const fftDataRef = useRef<Float32Array>(new Float32Array(1024));

// CORRECT - Use requestAnimationFrame for display updates
const animate = () => {
  updateWaterfall();
  requestAnimationFrame(animate);
};

// CORRECT - Store only UI control state in React state
const [isPaused, setIsPaused] = useState(false);
const [colorMap, setColorMap] = useState<ColorMap>('viridis');
```

---

## Protocol Buffer Definitions

### Exact proto file: `proto/sdr.proto`

```protobuf
syntax = "proto3";

package sdr;

// ============================================================================
// ENUMS - Exact values and meanings
// ============================================================================

enum OperationMode {
  MODE_UNSPECIFIED = 0;  // Invalid, must specify
  MODE_RX = 1;           // Receive only
  MODE_TX = 2;           // Transmit only
  MODE_TRX = 3;          // Full duplex transceive
}

enum RFPath {
  RF_PATH_UNSPECIFIED = 0;  // Invalid
  RF_PATH_LNAH = 1;         // High band LNA (1.5-6 GHz)
  RF_PATH_LNAL = 2;         // Low band LNA (0.1-1.5 GHz)
  RF_PATH_LNAW = 3;         // Wide band LNA (0.1-6 GHz)
}

enum ClockSource {
  CLOCK_INTERNAL = 0;   // Internal 40 MHz TCXO
  CLOCK_EXTERNAL = 1;   // External 10 MHz reference
  CLOCK_GPSDO = 2;      // GPS-disciplined oscillator
}

enum DataFormat {
  FORMAT_IQ16 = 0;  // 16-bit I/Q (default, best quality)
  FORMAT_IQ12 = 1;  // 12-bit I/Q (reduced bandwidth)
  FORMAT_IQ8 = 2;   // 8-bit I/Q (lowest bandwidth)
}

enum SyncType {
  SYNC_NONE = 0;       // No synchronization
  SYNC_INTERNAL = 1;   // Internal timing
  SYNC_EXTERNAL = 2;   // External PPS/trigger
  SYNC_GPS = 3;        // GPS 1PPS
}

enum DemodulationMode {
  DEMOD_NONE = 0;   // Raw I/Q
  DEMOD_AM = 1;     // Amplitude modulation
  DEMOD_FM = 2;     // Frequency modulation
  DEMOD_USB = 3;    // Upper sideband
  DEMOD_LSB = 4;    // Lower sideband
  DEMOD_CW = 5;     // Continuous wave
}

// ============================================================================
// MESSAGES - Exact field types
// ============================================================================

message FrequencyRequest {
  double rx_center_frequency_hz = 1;  // Range: 100e6 to 6e9 (100 MHz - 6 GHz)
  double tx_center_frequency_hz = 2;  // Range: 100e6 to 6e9
  double rx_bandwidth_hz = 3;         // Range: 200e3 to 100e6 (200 kHz - 100 MHz)
  double tx_bandwidth_hz = 4;         // Range: 200e3 to 100e6
}

message GainRequest {
  int32 lna_gain_db = 1;  // Range: 0-30, step: 3 dB
  int32 pga_gain_db = 2;  // Range: 0-19, step: 1 dB
  int32 vga_gain_db = 3;  // Range: 0-15, step: 1 dB
  int32 tx_gain_db = 4;   // Range: 0-47, step: 1 dB
}

message SampleRateRequest {
  double sample_rate_hz = 1;  // Range: 1e6 to 100e6 (1-100 MSPS)
  int32 decimation = 2;       // Valid: 1, 2, 4, 8, 16, 32, 64 (power of 2)
  DataFormat data_format = 3; // See DataFormat enum
}

message StreamStartRequest {
  int32 buffer_size_samples = 1;  // Range: 1024 to 1048576, must be power of 2
  int32 num_buffers = 2;          // Range: 2 to 32
  DemodulationMode demod_mode = 3;
}

message IQStreamRequest {
  int32 fft_size = 1;        // Valid: 256, 512, 1024, 2048, 4096
  int32 update_rate_ms = 2;  // Range: 20 to 1000 (20ms = 50 FPS max)
}

message StatusReply {
  bool success = 1;
  string message = 2;
  
  // Current device state
  double rx_center_frequency_hz = 3;
  double sample_rate_hz = 4;
  int32 total_rx_gain_db = 5;
  bool streaming_active = 6;
  
  // Statistics
  uint64 samples_processed = 7;
  uint64 samples_dropped = 8;
  int64 timestamp_ms = 9;
  bool device_connected = 10;
}

message IQDataChunk {
  int64 timestamp_ms = 1;
  double center_frequency_hz = 2;
  double sample_rate_hz = 3;
  int32 fft_size = 4;
  repeated float fft_magnitudes = 5;  // Length = fft_size, values in dB
}

message MetricsUpdate {
  double throughput_mbps = 1;
  uint64 samples_processed = 2;
  uint64 samples_dropped = 3;
  float cpu_usage_percent = 4;
  float gpu_usage_percent = 5;
  float gpu_memory_used_mb = 6;
  int64 timestamp_ms = 7;
}

// ============================================================================
// SERVICES - Exact RPC signatures
// ============================================================================

service RadioControl {
  rpc SetFrequency(FrequencyRequest) returns (StatusReply);
  rpc SetGain(GainRequest) returns (StatusReply);
  rpc SetSampleRate(SampleRateRequest) returns (StatusReply);
  rpc GetStatus(google.protobuf.Empty) returns (StatusReply);
}

service StreamControl {
  rpc StartStream(StreamStartRequest) returns (StatusReply);
  rpc StopStream(google.protobuf.Empty) returns (StatusReply);
  rpc GetStreamStatus(google.protobuf.Empty) returns (StatusReply);
  rpc StreamMetrics(google.protobuf.Empty) returns (stream MetricsUpdate);
  rpc StreamIQData(IQStreamRequest) returns (stream IQDataChunk);
}
```

---

## React Component Specifications

### Waterfall Chart Component

**File:** `client/src/components/WaterfallChart.tsx`

```typescript
import { useRef, useEffect, useState } from 'react';

// ============================================================================
// TYPES - Exact definitions
// ============================================================================

type ColorMap = 'viridis' | 'plasma' | 'hot' | 'cool' | 'grayscale';

type FFTWindow = 'rectangular' | 'hann' | 'hamming' | 'blackman' | 'blackman-harris' | 'flattop';

interface WaterfallProps {
  width: number;          // Canvas width in pixels
  height: number;         // Canvas height in pixels
  fftSize: number;        // Valid: 256, 512, 1024, 2048, 4096
  colorMap: ColorMap;
  minDb: number;          // Range: -120 to 0
  maxDb: number;          // Range: -120 to 0, must be > minDb
  window: FFTWindow;
}

// ============================================================================
// PERFORMANCE CRITICAL - Use useRef, NOT useState
// ============================================================================

function WaterfallChart({ width, height, fftSize, colorMap, minDb, maxDb, window }: WaterfallProps) {
  // ✅ CORRECT - Canvas and rendering data in refs (no re-renders)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const waterfallDataRef = useRef<Uint8ClampedArray>(new Uint8ClampedArray(width * height * 4));
  const fftBufferRef = useRef<Float32Array>(new Float32Array(fftSize));
  const animationFrameRef = useRef<number>(0);
  
  // ✅ CORRECT - Only UI controls in state
  const [isPaused, setIsPaused] = useState(false);
  
  // Initialize canvas context once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctxRef.current = canvas.getContext('2d', {
      alpha: false,  // Performance: disable alpha channel
      desynchronized: true  // Performance: allow async rendering
    });
  }, []);
  
  // ✅ CORRECT - Use requestAnimationFrame for updates
  useEffect(() => {
    if (isPaused) return;
    
    const animate = () => {
      renderWaterfall();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, colorMap, minDb, maxDb]);
  
  // Render function - called by requestAnimationFrame
  const renderWaterfall = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    // Scroll waterfall down by 1 pixel
    const imageData = ctx.getImageData(0, 0, width, height - 1);
    ctx.putImageData(imageData, 0, 1);
    
    // Draw new FFT line at top
    const fftData = fftBufferRef.current;
    for (let x = 0; x < width; x++) {
      const binIndex = Math.floor((x / width) * fftSize);
      const dbValue = fftData[binIndex];
      const color = mapDbToColor(dbValue, minDb, maxDb, colorMap);
      ctx.fillStyle = color;
      ctx.fillRect(x, 0, 1, 1);
    }
  };
  
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }}
      />
      <button onClick={() => setIsPaused(!isPaused)}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
}

// ============================================================================
// COLOR MAPPING - Exact RGB values
// ============================================================================

function mapDbToColor(db: number, minDb: number, maxDb: number, colorMap: ColorMap): string {
  // Normalize to 0-1
  const normalized = Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  
  let r: number, g: number, b: number;
  
  switch (colorMap) {
    case 'viridis':
      // Viridis color map (perceptually uniform)
      if (normalized < 0.25) {
        r = 68 + (59 - 68) * (normalized / 0.25);
        g = 1 + (82 - 1) * (normalized / 0.25);
        b = 84 + (139 - 84) * (normalized / 0.25);
      } else if (normalized < 0.5) {
        const t = (normalized - 0.25) / 0.25;
        r = 59 + (33 - 59) * t;
        g = 82 + (145 - 82) * t;
        b = 139 + (140 - 139) * t;
      } else if (normalized < 0.75) {
        const t = (normalized - 0.5) / 0.25;
        r = 33 + (94 - 33) * t;
        g = 145 + (201 - 145) * t;
        b = 140 + (98 - 140) * t;
      } else {
        const t = (normalized - 0.75) / 0.25;
        r = 94 + (253 - 94) * t;
        g = 201 + (231 - 201) * t;
        b = 98 + (37 - 98) * t;
      }
      break;
      
    case 'plasma':
      // Plasma color map
      if (normalized < 0.33) {
        const t = normalized / 0.33;
        r = 13 + (126 - 13) * t;
        g = 8 + (3 - 8) * t;
        b = 135 + (167 - 135) * t;
      } else if (normalized < 0.66) {
        const t = (normalized - 0.33) / 0.33;
        r = 126 + (240 - 126) * t;
        g = 3 + (97 - 3) * t;
        b = 167 + (25 - 167) * t;
      } else {
        const t = (normalized - 0.66) / 0.34;
        r = 240 + (252 - 240) * t;
        g = 97 + (255 - 97) * t;
        b = 25 + (164 - 25) * t;
      }
      break;
      
    case 'hot':
      // Hot color map (black -> red -> yellow -> white)
      if (normalized < 0.33) {
        r = 255 * (normalized / 0.33);
        g = 0;
        b = 0;
      } else if (normalized < 0.66) {
        r = 255;
        g = 255 * ((normalized - 0.33) / 0.33);
        b = 0;
      } else {
        r = 255;
        g = 255;
        b = 255 * ((normalized - 0.66) / 0.34);
      }
      break;
      
    case 'cool':
      // Cool color map (cyan -> magenta)
      r = 255 * normalized;
      g = 255 * (1 - normalized);
      b = 255;
      break;
      
    case 'grayscale':
      // Grayscale
      r = g = b = 255 * normalized;
      break;
  }
  
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
```

---

## gRPC Client Hook Specifications

**File:** `client/src/lib/grpc/grpc-hooks.ts`

```typescript
import { useRef, useEffect, useCallback } from 'react';
import { RadioControlClient, StreamControlClient } from '@/generated/SdrServiceClientPb';
import { FrequencyRequest, GainRequest, IQStreamRequest } from '@/generated/sdr_pb';

// ============================================================================
// EXACT FUNCTION SIGNATURES
// ============================================================================

/**
 * Hook for streaming FFT data from gRPC server
 * 
 * @param fftSize - FFT size (256, 512, 1024, 2048, 4096)
 * @param updateRateMs - Update rate in milliseconds (20-1000)
 * @param onData - Callback receives Float32Array of FFT magnitudes in dB
 * 
 * ❌ DO NOT store FFT data in React state
 * ✅ DO pass data directly to useRef in callback
 */
export function useGrpcFFTStream(
  fftSize: 256 | 512 | 1024 | 2048 | 4096,
  updateRateMs: number,  // Range: 20 to 1000
  onData: (fftData: Float32Array, timestamp: number) => void
): {
  isConnected: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
} {
  const streamRef = useRef<any>(null);
  const isConnectedRef = useRef(false);
  
  const start = useCallback(() => {
    const client = new StreamControlClient('http://localhost:50051');
    const request = new IQStreamRequest();
    request.setFftSize(fftSize);
    request.setUpdateRateMs(updateRateMs);
    
    const stream = client.streamIQData(request, {});
    
    stream.on('data', (chunk) => {
      const magnitudes = chunk.getFftMagnitudesList();
      const fftArray = new Float32Array(magnitudes);
      const timestamp = chunk.getTimestampMs();
      
      // ✅ CORRECT - Pass data to callback, don't store in state
      onData(fftArray, timestamp);
    });
    
    stream.on('error', (err) => {
      console.error('gRPC stream error:', err);
      isConnectedRef.current = false;
    });
    
    stream.on('end', () => {
      isConnectedRef.current = false;
    });
    
    streamRef.current = stream;
    isConnectedRef.current = true;
  }, [fftSize, updateRateMs, onData]);
  
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.cancel();
      streamRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);
  
  return {
    isConnected: isConnectedRef.current,
    error: null,
    start,
    stop
  };
}

/**
 * Hook for setting device frequency
 * 
 * @returns setFrequency function with exact parameter types
 */
export function useGrpcSetFrequency(): {
  setFrequency: (
    rxFreqHz: number,  // Range: 100e6 to 6e9
    txFreqHz: number,  // Range: 100e6 to 6e9
    rxBwHz: number,    // Range: 200e3 to 100e6
    txBwHz: number     // Range: 200e3 to 100e6
  ) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
} {
  const setFrequency = useCallback(async (
    rxFreqHz: number,
    txFreqHz: number,
    rxBwHz: number,
    txBwHz: number
  ) => {
    const client = new RadioControlClient('http://localhost:50051');
    const request = new FrequencyRequest();
    
    request.setRxCenterFrequencyHz(rxFreqHz);
    request.setTxCenterFrequencyHz(txFreqHz);
    request.setRxBandwidthHz(rxBwHz);
    request.setTxBandwidthHz(txBwHz);
    
    return new Promise((resolve, reject) => {
      client.setFrequency(request, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: response.getSuccess(),
            message: response.getMessage()
          });
        }
      });
    });
  }, []);
  
  return { setFrequency, isLoading: false };
}
```

---

## Parameter Validation Rules

### Frequency Validation
```typescript
function validateFrequency(freqHz: number): boolean {
  const MIN_FREQ = 100e6;   // 100 MHz
  const MAX_FREQ = 6e9;     // 6 GHz
  return freqHz >= MIN_FREQ && freqHz <= MAX_FREQ;
}
```

### Gain Validation
```typescript
function validateGain(lna: number, pga: number, vga: number): boolean {
  // LNA: 0-30 dB, step 3 dB
  if (lna < 0 || lna > 30 || lna % 3 !== 0) return false;
  
  // PGA: 0-19 dB, step 1 dB
  if (pga < 0 || pga > 19) return false;
  
  // VGA: 0-15 dB, step 1 dB
  if (vga < 0 || vga > 15) return false;
  
  // Total gain safety limit
  const totalGain = lna + pga + vga;
  if (totalGain > 60) return false;  // Prevent ADC saturation
  
  return true;
}
```

### Sample Rate Validation
```typescript
function validateSampleRate(rateHz: number, decimation: number): boolean {
  const MIN_RATE = 1e6;    // 1 MSPS
  const MAX_RATE = 100e6;  // 100 MSPS
  
  if (rateHz < MIN_RATE || rateHz > MAX_RATE) return false;
  
  // Decimation must be power of 2
  const validDecimations = [1, 2, 4, 8, 16, 32, 64];
  if (!validDecimations.includes(decimation)) return false;
  
  return true;
}
```

### FFT Size Validation
```typescript
function validateFFTSize(size: number): boolean {
  const validSizes = [256, 512, 1024, 2048, 4096];
  return validSizes.includes(size);
}
```

---

## Filter Defaults Per Demodulation Mode

```typescript
const FILTER_DEFAULTS: Record<DemodulationMode, { bandwidth: number; sampleRate: number }> = {
  DEMOD_NONE: {
    bandwidth: 10e6,   // 10 MHz (full bandwidth)
    sampleRate: 10e6   // 10 MSPS
  },
  DEMOD_AM: {
    bandwidth: 10e3,   // 10 kHz (AM broadcast)
    sampleRate: 48e3   // 48 kSPS
  },
  DEMOD_FM: {
    bandwidth: 200e3,  // 200 kHz (FM broadcast)
    sampleRate: 240e3  // 240 kSPS
  },
  DEMOD_USB: {
    bandwidth: 2.7e3,  // 2.7 kHz (SSB voice)
    sampleRate: 12e3   // 12 kSPS
  },
  DEMOD_LSB: {
    bandwidth: 2.7e3,  // 2.7 kHz (SSB voice)
    sampleRate: 12e3   // 12 kSPS
  },
  DEMOD_CW: {
    bandwidth: 500,    // 500 Hz (CW narrow)
    sampleRate: 8e3    // 8 kSPS
  }
};
```

---

## Summary

**This document provides:**
✅ Exact function signatures (copy-paste ready)
✅ All enum values with meanings
✅ Valid ranges for every parameter
✅ Performance rules (useRef vs useState)
✅ Rendering rules (requestAnimationFrame vs setInterval)
✅ Validation functions
✅ Filter defaults per mode
✅ Color map implementations

**No ambiguity. No excuses. Implementation contract defined.**
