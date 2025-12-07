# Frontend Migration Guide: tRPC to gRPC-Web

This guide shows how to migrate React components from tRPC to gRPC-Web for the uSDR Development Board Dashboard.

## Overview

The migration involves:
1. Replacing tRPC hooks (`trpc.*`) with gRPC-Web hooks (`useGrpcQuery`, `useGrpcMutation`)
2. Creating Protocol Buffer message objects instead of plain JavaScript objects
3. Using getter/setter methods instead of direct property access
4. Updating error handling to use gRPC status codes

## Import Changes

### Before (tRPC)
```typescript
import { trpc } from '../lib/trpc';
```

### After (gRPC-Web)
```typescript
import { useDeviceStatus, useStreamControl, grpcApi, useGrpcMutation } from '../lib/grpc-client';
import * as sdr_pb from '../generated/sdr_pb';
```

## Query Pattern

### Before (tRPC)
```typescript
const { data: status, isLoading, error } = trpc.device.getStatus.useQuery(undefined, {
  refetchInterval: 1000,
});

// Access data directly
const frequency = status?.rxFrequency;
const streaming = status?.streaming;
```

### After (gRPC-Web)
```typescript
const { data: status, isLoading, error } = useDeviceStatus(1000);

// Use getter methods
const frequency = status?.getRxCenterHz();
const streaming = status?.getStreaming();
```

## Mutation Pattern

### Before (tRPC)
```typescript
const updateFrequency = trpc.device.setFrequency.useMutation({
  onSuccess: () => {
    toast.success('Frequency updated');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Call with plain object
updateFrequency.mutate({
  rxCenterHz: 2450000000,
  txCenterHz: 2450000000,
});
```

### After (gRPC-Web)
```typescript
const updateFrequency = useGrpcMutation(grpcApi.setFrequency, {
  onSuccess: () => {
    toast.success('Frequency updated');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Create Protocol Buffer message
const request = new sdr_pb.FrequencyRequest();
request.setRxCenterHz(2450000000);
request.setTxCenterHz(2450000000);

updateFrequency.mutate(request);
```

## Complete Component Example

### Before (tRPC)
```typescript
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

export function FrequencyControl() {
  const [frequency, setFrequency] = useState(2450000000);
  
  const { data: status } = trpc.device.getStatus.useQuery();
  
  const updateMutation = trpc.device.setFrequency.useMutation({
    onSuccess: () => toast.success('Frequency updated'),
    onError: (error) => toast.error(error.message),
  });
  
  const handleUpdate = () => {
    updateMutation.mutate({
      rxCenterHz: frequency,
      txCenterHz: frequency,
    });
  };
  
  return (
    <div>
      <p>Current: {status?.rxFrequency} Hz</p>
      <input 
        type="number" 
        value={frequency}
        onChange={(e) => setFrequency(Number(e.target.value))}
      />
      <button 
        onClick={handleUpdate}
        disabled={updateMutation.isLoading}
      >
        Update
      </button>
    </div>
  );
}
```

### After (gRPC-Web)
```typescript
import { useDeviceStatus, grpcApi, useGrpcMutation } from '../lib/grpc-client';
import * as sdr_pb from '../generated/sdr_pb';
import { toast } from 'sonner';

export function FrequencyControl() {
  const [frequency, setFrequency] = useState(2450000000);
  
  const { data: status } = useDeviceStatus();
  
  const updateMutation = useGrpcMutation(grpcApi.setFrequency, {
    onSuccess: () => toast.success('Frequency updated'),
    onError: (error) => toast.error(error.message),
  });
  
  const handleUpdate = () => {
    const request = new sdr_pb.FrequencyRequest();
    request.setRxCenterHz(frequency);
    request.setTxCenterHz(frequency);
    
    updateMutation.mutate(request);
  };
  
  return (
    <div>
      <p>Current: {status?.getRxCenterHz()} Hz</p>
      <input 
        type="number" 
        value={frequency}
        onChange={(e) => setFrequency(Number(e.target.value))}
      />
      <button 
        onClick={handleUpdate}
        disabled={updateMutation.isLoading}
      >
        Update
      </button>
    </div>
  );
}
```

## Streaming Control Example

### Before (tRPC)
```typescript
const startStream = trpc.streaming.start.useMutation();
const stopStream = trpc.streaming.stop.useMutation();

// Start streaming
startStream.mutate({
  sessionName: 'test-session',
  configuration: { /* ... */ },
});

// Stop streaming
stopStream.mutate({ sessionId: 'session_123' });
```

### After (gRPC-Web)
```typescript
import { useStreamControl } from '../lib/grpc-client';
import * as sdr_pb from '../generated/sdr_pb';

const { start, stop, isStarting, isStopping } = useStreamControl();

// Start streaming
const startRequest = new sdr_pb.StreamRequest();
startRequest.setSessionName('test-session');
// ... set configuration

start(startRequest);

// Stop streaming
const stopRequest = new sdr_pb.StreamStopRequest();
stopRequest.setSessionId('session_123');

stop(stopRequest);
```

## Preset Management Example

### Before (tRPC)
```typescript
const { data: presets } = trpc.presets.list.useQuery();
const savePreset = trpc.presets.save.useMutation();
const loadPreset = trpc.presets.load.useMutation();

// Save preset
savePreset.mutate({
  name: 'My Preset',
  description: 'Test configuration',
  configuration: { /* ... */ },
});

// Load preset
loadPreset.mutate({ presetId: 'preset_123' });
```

### After (gRPC-Web)
```typescript
import { usePresets } from '../lib/grpc-client';
import * as sdr_pb from '../generated/sdr_pb';

const { presets, save, load } = usePresets();

// Save preset
const saveRequest = new sdr_pb.SavePresetRequest();
saveRequest.setName('My Preset');
saveRequest.setDescription('Test configuration');
// ... set configuration

save(saveRequest);

// Load preset
const loadRequest = new sdr_pb.LoadPresetRequest();
loadRequest.setPresetId('preset_123');

load(loadRequest);
```

## Error Handling

### Before (tRPC)
```typescript
const mutation = trpc.device.setFrequency.useMutation({
  onError: (error) => {
    // tRPC error object
    console.error('Error code:', error.data?.code);
    console.error('Message:', error.message);
  },
});
```

### After (gRPC-Web)
```typescript
const mutation = useGrpcMutation(grpcApi.setFrequency, {
  onError: (error) => {
    // gRPC error object
    console.error('Status code:', error.code); // 0-16
    console.error('Message:', error.message);
    
    // Handle specific gRPC status codes
    switch (error.code) {
      case 3: // INVALID_ARGUMENT
        toast.error('Invalid parameter value');
        break;
      case 14: // UNAVAILABLE
        toast.error('Device not available');
        break;
      default:
        toast.error(error.message);
    }
  },
});
```

## Common gRPC Status Codes

| Code | Name | Meaning |
|------|------|---------|
| 0 | OK | Success |
| 1 | CANCELLED | Operation cancelled |
| 2 | UNKNOWN | Unknown error |
| 3 | INVALID_ARGUMENT | Invalid parameter |
| 4 | DEADLINE_EXCEEDED | Timeout |
| 5 | NOT_FOUND | Resource not found |
| 7 | PERMISSION_DENIED | Access denied |
| 13 | INTERNAL | Internal server error |
| 14 | UNAVAILABLE | Service unavailable |

## Data Type Conversions

### Enums

#### Before (tRPC)
```typescript
const mode = 'RX'; // string
```

#### After (gRPC-Web)
```typescript
import { OperationMode } from '../generated/sdr_pb';

const mode = OperationMode.RX; // enum value (number)

// Setting enum in request
request.setMode(OperationMode.RX);

// Reading enum from response
const currentMode = status.getMode();
if (currentMode === OperationMode.RX) {
  // ...
}
```

### Nested Messages

#### Before (tRPC)
```typescript
const config = {
  mode: 'RX',
  frequency: {
    rxCenterHz: 2450000000,
    txCenterHz: 2450000000,
  },
  gain: {
    rxLnaDb: 20,
    rxPgaDb: 10,
  },
};
```

#### After (gRPC-Web)
```typescript
const freqRequest = new sdr_pb.FrequencyRequest();
freqRequest.setRxCenterHz(2450000000);
freqRequest.setTxCenterHz(2450000000);

const gainRequest = new sdr_pb.GainRequest();
gainRequest.setRxLnaDb(20);
gainRequest.setRxPgaDb(10);

const configRequest = new sdr_pb.ConfigurationRequest();
configRequest.setMode(sdr_pb.OperationMode.RX);
configRequest.setFrequency(freqRequest);
configRequest.setGain(gainRequest);
```

## Testing

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDeviceStatus } from '../lib/grpc-client';

// Mock gRPC client
jest.mock('../generated/SdrServiceClientPb');

test('useDeviceStatus fetches device status', async () => {
  const { result } = renderHook(() => useDeviceStatus());
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.data).toBeDefined();
  expect(result.current.data?.getReady()).toBe(true);
});
```

## Migration Checklist

- [ ] Install gRPC-Web dependencies
- [ ] Generate Protocol Buffer code
- [ ] Create gRPC-Web client wrapper
- [ ] Update imports in components
- [ ] Replace `trpc.*` hooks with gRPC hooks
- [ ] Convert plain objects to Protocol Buffer messages
- [ ] Update property access to use getters/setters
- [ ] Update error handling for gRPC status codes
- [ ] Test all components
- [ ] Remove tRPC dependencies

## Common Pitfalls

1. **Forgetting to create new message instances**
   ```typescript
   // ❌ Wrong
   updateMutation.mutate({ rxCenterHz: 2450000000 });
   
   // ✅ Correct
   const request = new sdr_pb.FrequencyRequest();
   request.setRxCenterHz(2450000000);
   updateMutation.mutate(request);
   ```

2. **Using direct property access instead of getters**
   ```typescript
   // ❌ Wrong
   const freq = status.rxCenterHz;
   
   // ✅ Correct
   const freq = status.getRxCenterHz();
   ```

3. **Not handling gRPC status codes**
   ```typescript
   // ❌ Wrong
   onError: (error) => toast.error(error.message)
   
   // ✅ Correct
   onError: (error) => {
     if (error.code === 14) {
       toast.error('Device unavailable - check connection');
     } else {
       toast.error(error.message);
     }
   }
   ```

## Benefits of gRPC-Web

1. **Type Safety**: Protocol Buffers provide strong typing
2. **Performance**: Binary serialization is faster than JSON
3. **Compatibility**: Native integration with C++ Holoscan backend
4. **Streaming**: Server-side streaming for real-time metrics
5. **Versioning**: Built-in backward compatibility

## Next Steps

After migrating all components:
1. Remove tRPC dependencies from `package.json`
2. Delete `client/src/lib/trpc.ts`
3. Remove tRPC router from backend
4. Test end-to-end with Holoscan backend
5. Monitor performance and latency
