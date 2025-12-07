#!/bin/bash
set -e

# Protocol Buffer compilation script
# Generates code for both Node.js backend (gRPC) and browser frontend (gRPC-Web)

PROTO_DIR="./proto"
OUT_DIR_NODE="./server/generated"
OUT_DIR_WEB="./client/src/generated"

echo "Compiling Protocol Buffers..."

# Create output directories
mkdir -p "$OUT_DIR_NODE"
mkdir -p "$OUT_DIR_WEB"

# Compile for Node.js backend (using @grpc/proto-loader at runtime, no codegen needed)
echo "✓ Node.js backend will use @grpc/proto-loader for dynamic loading"

# Use system protoc with grpc-web plugin for Web frontend
echo "Compiling for Web frontend (grpc-web)..."

protoc \
  --js_out=import_style=commonjs,binary:"$OUT_DIR_WEB" \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:"$OUT_DIR_WEB" \
  --proto_path="$PROTO_DIR" \
  "$PROTO_DIR/sdr.proto"

echo "✓ Protocol Buffers compiled successfully!"
echo "  - Node.js: Using dynamic loading with @grpc/proto-loader"
echo "  - Web: Generated TypeScript code in $OUT_DIR_WEB"
