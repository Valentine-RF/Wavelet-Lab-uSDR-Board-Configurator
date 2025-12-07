# Holoscan RF Pipeline Backend Integration Guide

This document explains how to integrate the uSDR Development Board Dashboard with your NVIDIA Holoscan RF Pipeline Backend using gRPC for the asynchronous control plane.

## Architecture Overview

The system follows a **bifurcated design** with two separate execution planes:

### Data Plane (Holoscan C++ Native)
- **Purpose**: Deterministic, real-time signal processing
- **Technology**: NVIDIA Holoscan SDK, MatX, CUDA
- **Execution**: Synchronous, runs at hardware clock speed
- **Memory**: Zero-copy architecture (PCIe → GPU via pinned memory)
- **Components**:
  - `UsdrRxOp`: Acquires I/Q samples from uSDR hardware
  - `DspMatxOp`: GPU-accelerated DSP (type conversion, DDC, FFT, windowing)
  - `HolovizOp`: Real-time waterfall/spectrum visualization
- **Constraint**: Cannot be interrupted by network I/O or API calls

### Control Plane (gRPC Server)
- **Purpose**: Asynchronous parameter updates and user commands
- **Technology**: Node.js with @grpc/grpc-js
- **Execution**: Asynchronous, runs in separate thread
- **Communication**: gRPC services for device configuration
- **Synchronization**: Atomic state variables for lock-free updates

## gRPC Service Definitions

The dashboard exposes three gRPC services defined in `proto/sdr.proto`:

### 1. RadioControl Service
Controls device configuration parameters:
- `SetFrequency(FrequencyRequest)` - Update RX/TX center frequency and bandwidth
- `SetGain(GainRequest)` - Update LNA, PGA, VGA, TX gain
- `SetSampleRate(SampleRateRequest)` - Update sample rate and data format
- `SetRFPath(RFPathRequest)` - Select RF path (e.g., "rxw2450_2500")
- `SetClockConfig(ClockConfigRequest)` - Configure clock source and tuning
- `SetBufferConfig(BufferConfigRequest)` - Set RX/TX buffer sizes
- `SetChannelConfig(ChannelConfigRequest)` - Configure channel selection
- `SetSyncType(SyncTypeRequest)` - Set timing synchronization type
- `SetDeviceParams(DeviceParamsRequest)` - Control LNA, PA, GPSDO, OSC
- `GetStatus(Empty)` - Query current device status
- `ApplyConfiguration(ConfigurationRequest)` - Apply complete configuration atomically

### 2. StreamControl Service
Manages data acquisition lifecycle:
- `StartStream(StreamRequest)` - Start streaming with configuration
- `StopStream(StreamStopRequest)` - Stop active stream
- `GetStreamStatus(StreamStatusRequest)` - Query stream metrics
- `StreamMetrics(StreamMetricsRequest)` - Server-side streaming for real-time metrics

### 3. ConfigurationService
Preset management:
- `SavePreset(SavePresetRequest)` - Save configuration as preset
- `LoadPreset(LoadPresetRequest)` - Load preset by ID
- `ListPresets(Empty)` - List all saved presets
- `DeletePreset(DeletePresetRequest)` - Delete preset

## C++ Client Integration Example

Here's how your Holoscan application would integrate with the gRPC control plane:

### 1. CMakeLists.txt Configuration

```cmake
find_package(gRPC CONFIG REQUIRED)
find_package(Protobuf REQUIRED)

# Generate C++ code from proto
protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS proto/sdr.proto)
grpc_generate_cpp(GRPC_SRCS GRPC_HDRS proto/sdr.proto)

add_executable(holoscan_sdr_app
  main.cpp
  usdr_rx_op.cpp
  dsp_matx_op.cpp
  ${PROTO_SRCS}
  ${GRPC_SRCS}
)

target_link_libraries(holoscan_sdr_app
  holoscan::core
  MatX::MatX
  gRPC::grpc++
  libusdr
  libcudart
)
```

### 2. Shared State with Atomic Variables

```cpp
// shared_state.hpp
#pragma once
#include <atomic>
#include <memory>

struct SharedRadioState {
  // Frequency parameters (atomic for lock-free updates)
  std::atomic<double> target_frequency_hz{2450000000.0};
  std::atomic<double> target_bandwidth_hz{100000000.0};
  
  // Gain parameters
  std::atomic<int32_t> target_lna_db{20};
  std::atomic<int32_t> target_pga_db{10};
  std::atomic<int32_t> target_vga_db{15};
  
  // Sample rate
  std::atomic<double> target_sample_rate_hz{40000000.0};
  
  // Current hardware state (read by gRPC, written by operator)
  std::atomic<double> current_frequency_hz{0.0};
  std::atomic<bool> streaming{false};
};

// Global shared state
extern std::shared_ptr<SharedRadioState> g_radio_state;
```

### 3. gRPC Service Implementation

```cpp
// grpc_service_impl.cpp
#include <grpcpp/grpcpp.h>
#include "sdr.grpc.pb.h"
#include "shared_state.hpp"

class RadioControlServiceImpl final : public sdr::RadioControl::Service {
public:
  RadioControlServiceImpl(std::shared_ptr<SharedRadioState> state)
    : state_(state) {}
  
  grpc::Status SetFrequency(
    grpc::ServerContext* context,
    const sdr::FrequencyRequest* request,
    sdr::StatusReply* response) override {
    
    // Update atomic state (lock-free)
    if (request->rx_center_hz() > 0) {
      state_->target_frequency_hz.store(request->rx_center_hz());
    }
    if (request->rx_bandwidth_hz() > 0) {
      state_->target_bandwidth_hz.store(request->rx_bandwidth_hz());
    }
    
    response->set_success(true);
    response->set_message("Frequency updated successfully");
    response->set_error_code(0);
    
    return grpc::Status::OK;
  }
  
  grpc::Status SetGain(
    grpc::ServerContext* context,
    const sdr::GainRequest* request,
    sdr::StatusReply* response) override {
    
    state_->target_lna_db.store(request->rx_lna_db());
    state_->target_pga_db.store(request->rx_pga_db());
    state_->target_vga_db.store(request->rx_vga_db());
    
    response->set_success(true);
    response->set_message("Gain updated successfully");
    response->set_error_code(0);
    
    return grpc::Status::OK;
  }
  
  grpc::Status GetStatus(
    grpc::ServerContext* context,
    const sdr::Empty* request,
    sdr::DeviceStatus* response) override {
    
    response->set_ready(true);
    response->set_mode(sdr::OperationMode::RX);
    response->set_rx_center_hz(state_->current_frequency_hz.load());
    response->set_sample_rate_hz(state_->target_sample_rate_hz.load());
    response->set_streaming(state_->streaming.load());
    
    return grpc::Status::OK;
  }
  
  // Implement other RPCs...
  
private:
  std::shared_ptr<SharedRadioState> state_;
};
```

### 4. gRPC Server Thread

```cpp
// grpc_server.cpp
#include <thread>
#include <grpcpp/grpcpp.h>
#include "grpc_service_impl.cpp"

void RunGrpcServer(std::shared_ptr<SharedRadioState> state) {
  std::string server_address("0.0.0.0:50051");
  
  RadioControlServiceImpl radio_service(state);
  // StreamControlServiceImpl stream_service(state);
  // ConfigurationServiceImpl config_service(state);
  
  grpc::ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&radio_service);
  // builder.RegisterService(&stream_service);
  // builder.RegisterService(&config_service);
  
  std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
  std::cout << "[gRPC] Server listening on " << server_address << std::endl;
  
  server->Wait();
}
```

### 5. Holoscan Operator with State Synchronization

```cpp
// usdr_rx_op.cpp
#include <holoscan/holoscan.hpp>
#include "shared_state.hpp"

class UsdrRxOp : public holoscan::Operator {
public:
  HOLOSCAN_OPERATOR_FORWARD_ARGS(UsdrRxOp)
  
  void setup(holoscan::OperatorSpec& spec) override {
    spec.output<holoscan::Tensor>("samples");
  }
  
  void initialize() override {
    // Initialize uSDR device
    usdr_dmd_create_string(dev_, "/dm/sdr/0/rx/freq", "2400000000");
    usdr_dms_create(stream_, dev_, "ci16@ci16", 0);
    
    // Allocate pinned memory for zero-copy
    cudaMallocHost(&pinned_buffer_, buffer_size_);
  }
  
  void compute(holoscan::InputContext&, holoscan::OutputContext& op_output,
               holoscan::ExecutionContext&) override {
    
    // Check for parameter updates (lock-free atomic read)
    double target_freq = g_radio_state->target_frequency_hz.load();
    if (target_freq != current_hw_freq_) {
      // Update hardware (safe point in frame cycle)
      usdr_dme_set_uint(dev_, "/dm/sdr/0/rx/freq", target_freq);
      current_hw_freq_ = target_freq;
      g_radio_state->current_frequency_hz.store(target_freq);
    }
    
    // Blocking call to receive samples
    usdr_dms_recv(stream_, pinned_buffer_, buffer_size_, &timestamp_);
    
    // Wrap in Tensor without copying (zero-copy to GPU)
    auto tensor = holoscan::Tensor::from_buffer(
      pinned_buffer_, buffer_size_, holoscan::TensorType::kDLCUDA);
    
    op_output.emit(tensor, "samples");
  }
  
private:
  void* dev_;
  void* stream_;
  void* pinned_buffer_;
  size_t buffer_size_ = 102400;
  uint64_t timestamp_;
  double current_hw_freq_ = 0.0;
};
```

### 6. Main Application

```cpp
// main.cpp
#include <holoscan/holoscan.hpp>
#include <thread>
#include "shared_state.hpp"
#include "grpc_server.cpp"
#include "usdr_rx_op.cpp"
#include "dsp_matx_op.cpp"

std::shared_ptr<SharedRadioState> g_radio_state;

class SdrApp : public holoscan::Application {
public:
  void compose() override {
    auto rx_op = make_operator<UsdrRxOp>("rx", Arg("sample_rate", 60e6));
    auto dsp_op = make_operator<DspMatxOp>("dsp");
    auto viz_op = make_operator<HolovizOp>("viz");
    
    add_flow(rx_op, dsp_op, {{"samples", "input"}});
    add_flow(dsp_op, viz_op, {{"spectrum", "input"}});
  }
};

int main(int argc, char** argv) {
  // Initialize shared state
  g_radio_state = std::make_shared<SharedRadioState>();
  
  // Launch gRPC server in separate thread
  std::thread grpc_thread(RunGrpcServer, g_radio_state);
  grpc_thread.detach();
  
  // Run Holoscan application (data plane)
  auto app = holoscan::make_application<SdrApp>();
  app->run();
  
  return 0;
}
```

## Key Integration Points

### 1. Lock-Free Synchronization
The control plane (gRPC) and data plane (Holoscan) communicate through `std::atomic` variables:
- **gRPC writes**: `state->target_frequency_hz.store(new_value)`
- **Operator reads**: `double target = state->target_frequency_hz.load()`
- **No mutexes**: Ensures data plane never blocks

### 2. Deterministic Update Points
Hardware state changes occur at safe points in the frame cycle:
```cpp
void compute() {
  // Safe point: beginning of frame, before DMA
  if (target_freq != current_hw_freq_) {
    usdr_dme_set_uint(dev_, "/dm/sdr/0/rx/freq", target_freq);
  }
  
  // DMA transfer (cannot be interrupted)
  usdr_dms_recv(stream_, buffer_, size_, &timestamp_);
}
```

### 3. Zero-Copy Memory Architecture
```
uSDR PCIe → Pinned Memory → GPU Memory
            ↑
            usdr_dms_recv() writes here
            holoscan::Tensor wraps without copy
```

## Dashboard Connection

The web dashboard connects to the gRPC server at `localhost:50051`:

### Browser (gRPC-Web)
```typescript
import { RadioControlClient } from './generated/SdrServiceClientPb';

const client = new RadioControlClient('http://localhost:3000');

// Set frequency
const request = new FrequencyRequest();
request.setRxCenterHz(2450000000);
client.setFrequency(request, {}, (err, response) => {
  console.log('Frequency updated:', response.getMessage());
});
```

### C++ Client (Native gRPC)
```cpp
auto channel = grpc::CreateChannel("localhost:50051", 
                                   grpc::InsecureChannelCredentials());
auto stub = sdr::RadioControl::NewStub(channel);

sdr::FrequencyRequest request;
request.set_rx_center_hz(2450000000);

sdr::StatusReply response;
grpc::ClientContext context;

grpc::Status status = stub->SetFrequency(&context, request, &response);
```

## Performance Considerations

### Latency
- **gRPC call latency**: ~1-5 ms (network + serialization)
- **Atomic state update**: <100 ns (lock-free)
- **Hardware update**: ~10-50 ms (device-dependent)
- **Data plane unaffected**: Zero jitter from control plane

### Throughput
- **Sample rate**: Up to 122.88 MSps (uSDR limit)
- **PCIe bandwidth**: ~6 GB/s (x4 link)
- **GPU processing**: >1 TB/s memory bandwidth (RTX 4090)

### CPU Isolation
```bash
# Isolate P-cores for real-time DSP
sudo nano /etc/default/grub
GRUB_CMDLINE_LINUX="isolcpus=16-23"

# Pin Holoscan threads to P-cores
taskset -c 16-23 ./holoscan_sdr_app
```

## Deployment

### Development
```bash
# Terminal 1: Start dashboard (includes gRPC server)
cd usdr-devboard-dashboard
pnpm dev

# Terminal 2: Start Holoscan application
cd holoscan-rf-pipeline
./build/holoscan_sdr_app
```

### Production
```bash
# Dashboard runs as systemd service
sudo systemctl start usdr-dashboard

# Holoscan runs with real-time priority
sudo chrt -f 99 ./holoscan_sdr_app
```

## Troubleshooting

### gRPC Connection Refused
```bash
# Check if server is running
netstat -an | grep 50051

# Test with grpcurl
grpcurl -plaintext localhost:50051 list
```

### Atomic State Not Updating
```cpp
// Ensure memory ordering
double target = state->target_frequency_hz.load(std::memory_order_acquire);
state->current_frequency_hz.store(value, std::memory_order_release);
```

### Data Plane Jitter
```bash
# Check for CPU migration
perf stat -e migrations ./holoscan_sdr_app

# Disable C-states
sudo cpupower frequency-set -g performance
sudo cpupower idle-set -D 0
```

## References

- [Holoscan SDK Documentation](https://docs.nvidia.com/holoscan/)
- [NVIDIA MatX](https://nvidia.github.io/MatX/)
- [gRPC C++ Tutorial](https://grpc.io/docs/languages/cpp/quickstart/)
- [uSDR Library](https://docs.wsdr.io/software/compile.html)
- [Protocol Buffers Guide](https://protobuf.dev/programming-guides/proto3/)
