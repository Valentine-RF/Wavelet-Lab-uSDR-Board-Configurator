# Backend Integration Guide for uSDR Dashboard

This guide explains how to integrate your C++ Holoscan application with the uSDR Development Board Dashboard.

---

## Overview

The dashboard communicates with your Holoscan backend via **gRPC** on port **50051**. The architecture uses:

- **Control Plane (gRPC)**: Asynchronous parameter updates from the dashboard
- **Data Plane (Holoscan)**: Deterministic GPU-accelerated DSP pipeline
- **Synchronization**: Atomic state variables for lock-free updates

---

## Quick Start

### 1. Configure Dashboard to Connect to Your Backend

The dashboard currently runs a **mock gRPC server** for demonstration. To connect to your real Holoscan backend:

**Option A: Environment Variable (Recommended)**

```bash
# Set the Holoscan backend address
export HOLOSCAN_GRPC_HOST=192.168.1.100  # Your workstation IP
export HOLOSCAN_GRPC_PORT=50051

# Start the dashboard
cd /path/to/usdr-devboard-dashboard
pnpm dev
```

**Option B: Configuration File**

Create `.env.local` in the project root:

```env
HOLOSCAN_GRPC_HOST=192.168.1.100
HOLOSCAN_GRPC_PORT=50051
```

### 2. Build Your C++ Holoscan gRPC Server

Use the example code in `docs/HOLOSCAN_INTEGRATION.md` as a starting point.

**Key files you need:**
- `proto/sdr.proto` - Protocol Buffer definitions (already provided)
- C++ gRPC server implementation (see example below)
- Your existing Holoscan application

---

## Protocol Buffer Schema

The dashboard uses the following gRPC services defined in `proto/sdr.proto`:

### RadioControl Service
```protobuf
service RadioControl {
  rpc SetFrequency (FrequencyRequest) returns (StatusReply);
  rpc SetGain (GainRequest) returns (StatusReply);
  rpc SetSampleRate (SampleRateRequest) returns (StatusReply);
  rpc GetStatus (Empty) returns (DeviceStatus);
  // ... more RPCs
}
```

### StreamControl Service
```protobuf
service StreamControl {
  rpc StartStream (StreamRequest) returns (StreamReply);
  rpc StopStream (StreamStopRequest) returns (StatusReply);
  rpc GetStreamStatus (StreamStatusRequest) returns (StreamStatusReply);
  rpc StreamMetrics (StreamMetricsRequest) returns (stream MetricsUpdate);
}
```

---

## C++ Implementation Example

### Step 1: Generate C++ Code from Proto

```bash
# Install gRPC C++ tools
sudo apt-get install -y protobuf-compiler libgrpc++-dev

# Generate C++ code
cd /path/to/usdr-devboard-dashboard
protoc --grpc_out=./cpp_generated \
       --cpp_out=./cpp_generated \
       --plugin=protoc-gen-grpc=`which grpc_cpp_plugin` \
       proto/sdr.proto
```

### Step 2: Implement gRPC Server

```cpp
#include <grpcpp/grpcpp.h>
#include "sdr.grpc.pb.h"
#include <atomic>
#include <thread>

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::Status;

// Atomic state for lock-free parameter updates
struct DeviceState {
    std::atomic<double> rxCenterHz{2450000000.0};
    std::atomic<double> txCenterHz{2450000000.0};
    std::atomic<double> rxBandwidthHz{20000000.0};
    std::atomic<int> rxLnaDb{20};
    std::atomic<int> rxPgaDb{10};
    std::atomic<int> rxVgaDb{15};
    std::atomic<int> txGainDb{40};
    std::atomic<double> sampleRateHz{40000000.0};
    std::atomic<bool> streaming{false};
};

DeviceState g_deviceState;

class RadioControlServiceImpl final : public sdr::RadioControl::Service {
public:
    Status SetFrequency(ServerContext* context, 
                       const sdr::FrequencyRequest* request,
                       sdr::StatusReply* reply) override {
        // Update atomic state (lock-free)
        g_deviceState.rxCenterHz.store(request->rx_center_hz());
        g_deviceState.txCenterHz.store(request->tx_center_hz());
        g_deviceState.rxBandwidthHz.store(request->rx_bandwidth_hz());
        
        reply->set_success(true);
        reply->set_message("Frequency updated");
        
        std::cout << "[Control Plane] Frequency set to " 
                  << request->rx_center_hz() << " Hz" << std::endl;
        
        return Status::OK;
    }
    
    Status SetGain(ServerContext* context,
                  const sdr::GainRequest* request,
                  sdr::StatusReply* reply) override {
        g_deviceState.rxLnaDb.store(request->rx_lna_db());
        g_deviceState.rxPgaDb.store(request->rx_pga_db());
        g_deviceState.rxVgaDb.store(request->rx_vga_db());
        g_deviceState.txGainDb.store(request->tx_gain_db());
        
        reply->set_success(true);
        reply->set_message("Gain updated");
        
        return Status::OK;
    }
    
    Status GetStatus(ServerContext* context,
                    const sdr::Empty* request,
                    sdr::DeviceStatus* reply) override {
        reply->set_center_frequency_hz(g_deviceState.rxCenterHz.load());
        reply->set_sample_rate_hz(g_deviceState.sampleRateHz.load());
        reply->set_streaming(g_deviceState.streaming.load());
        reply->set_uptime_ms(getUptimeMs());
        
        return Status::OK;
    }
    
private:
    int64_t getUptimeMs() {
        // Implement uptime tracking
        return 0;
    }
};

class StreamControlServiceImpl final : public sdr::StreamControl::Service {
public:
    Status StartStream(ServerContext* context,
                      const sdr::StreamRequest* request,
                      sdr::StreamReply* reply) override {
        g_deviceState.streaming.store(true);
        
        reply->set_success(true);
        reply->set_session_id(request->session_name());
        reply->set_message("Stream started");
        
        std::cout << "[Control Plane] Stream started" << std::endl;
        
        return Status::OK;
    }
    
    Status StopStream(ServerContext* context,
                     const sdr::StreamStopRequest* request,
                     sdr::StatusReply* reply) override {
        g_deviceState.streaming.store(false);
        
        reply->set_success(true);
        reply->set_message("Stream stopped");
        
        return Status::OK;
    }
    
    Status StreamMetrics(ServerContext* context,
                        const sdr::StreamMetricsRequest* request,
                        grpc::ServerWriter<sdr::MetricsUpdate>* writer) override {
        // Send metrics every second
        while (g_deviceState.streaming.load()) {
            sdr::MetricsUpdate metrics;
            metrics.set_timestamp_ms(getCurrentTimeMs());
            metrics.set_throughput_mbps(calculateThroughput());
            metrics.set_dropped_samples(0);
            metrics.set_cpu_usage_percent(getCpuUsage());
            metrics.set_gpu_usage_percent(getGpuUsage());
            
            writer->Write(metrics);
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
        
        return Status::OK;
    }
    
private:
    int64_t getCurrentTimeMs() {
        return std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
    }
    
    double calculateThroughput() {
        double sampleRate = g_deviceState.sampleRateHz.load();
        return (sampleRate * 4 * 8) / 1e6; // CI16 format, Mbps
    }
    
    float getCpuUsage() { return 45.0f; } // Implement real CPU monitoring
    float getGpuUsage() { return 78.0f; } // Implement real GPU monitoring
};

void RunServer() {
    std::string server_address("0.0.0.0:50051");
    RadioControlServiceImpl radioService;
    StreamControlServiceImpl streamService;
    
    ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&radioService);
    builder.RegisterService(&streamService);
    
    std::unique_ptr<Server> server(builder.BuildAndStart());
    std::cout << "[gRPC] Server listening on " << server_address << std::endl;
    
    server->Wait();
}

int main(int argc, char** argv) {
    RunServer();
    return 0;
}
```

### Step 3: Integrate with Holoscan Data Plane

```cpp
// In your Holoscan operator's compute() method:
void YourOperator::compute(InputContext& input, OutputContext& output, ExecutionContext& context) {
    // Read atomic state at frame boundary (safe point)
    double frequency = g_deviceState.rxCenterHz.load(std::memory_order_relaxed);
    double sampleRate = g_deviceState.sampleRateHz.load(std::memory_order_relaxed);
    int totalGain = g_deviceState.rxLnaDb.load() + 
                    g_deviceState.rxPgaDb.load() + 
                    g_deviceState.rxVgaDb.load();
    
    // Apply parameters to hardware
    if (frequency != m_lastFrequency) {
        applyFrequencyChange(frequency);
        m_lastFrequency = frequency;
    }
    
    // Continue with deterministic DSP pipeline
    // ... your existing Holoscan code ...
}
```

---

## Network Configuration

### Firewall Rules

Allow gRPC traffic on port 50051:

```bash
# Ubuntu/Debian
sudo ufw allow 50051/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=50051/tcp
sudo firewall-cmd --reload
```

### Testing Connection

```bash
# From dashboard server, test gRPC connection
grpcurl -plaintext 192.168.1.100:50051 list

# Should show:
# sdr.RadioControl
# sdr.StreamControl
# sdr.ConfigurationService
```

---

## Deployment Scenarios

### Scenario 1: Same Machine
Dashboard and Holoscan on the same workstation:
```env
HOLOSCAN_GRPC_HOST=localhost
HOLOSCAN_GRPC_PORT=50051
```

### Scenario 2: Local Network
Dashboard on laptop, Holoscan on workstation:
```env
HOLOSCAN_GRPC_HOST=192.168.1.100  # Workstation IP
HOLOSCAN_GRPC_PORT=50051
```

### Scenario 3: Remote Access
Dashboard in cloud, Holoscan on-premises:
```env
HOLOSCAN_GRPC_HOST=your-domain.com
HOLOSCAN_GRPC_PORT=50051
# Requires port forwarding or VPN
```

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 192.168.1.100:50051
```
**Solution**: Check if gRPC server is running and firewall allows port 50051

### UNAVAILABLE Status
```
gRPC Error: 14 UNAVAILABLE: No connection could be made
```
**Solution**: Verify network connectivity and correct IP address

### UNIMPLEMENTED
```
gRPC Error: 12 UNIMPLEMENTED: Method not implemented
```
**Solution**: Ensure all RPCs from `sdr.proto` are implemented in C++

---

## Performance Tuning

### Reduce Control Latency
```cpp
// Use relaxed memory ordering for non-critical reads
double freq = g_deviceState.rxCenterHz.load(std::memory_order_relaxed);

// Use acquire/release for critical synchronization
g_deviceState.streaming.store(true, std::memory_order_release);
```

### Optimize Streaming
```cpp
// Send metrics at lower frequency
std::this_thread::sleep_for(std::chrono::milliseconds(500)); // 2 Hz
```

---

## Next Steps

1. ✅ Copy `proto/sdr.proto` to your C++ project
2. ✅ Generate C++ gRPC code
3. ✅ Implement the gRPC services (use example above)
4. ✅ Integrate atomic state with your Holoscan operators
5. ✅ Configure dashboard to point to your backend
6. ✅ Test connection and verify control latency

For detailed C++ integration examples, see `docs/HOLOSCAN_INTEGRATION.md`.

For waterfall visualization integration, see `docs/WATERFALL_INTEGRATION.md` (if implemented).
