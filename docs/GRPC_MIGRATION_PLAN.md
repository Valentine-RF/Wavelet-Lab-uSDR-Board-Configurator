# gRPC Migration Plan - Incremental & Safe

## Critical Rule: Dashboard Must Stay Accessible

**At every phase, the dashboard MUST remain fully functional and accessible.**

## Phase 1: Create gRPC Infrastructure (No Code Changes)

**Goal:** Set up all gRPC files WITHOUT modifying any existing code

**Tasks:**
- [ ] Create `proto/sdr.proto` with service definitions
- [ ] Install gRPC dependencies (`@grpc/grpc-js`, `@grpc/proto-loader`)
- [ ] Create proto compilation script
- [ ] Generate server-side code ONLY (not client yet)
- [ ] Create `server/grpc/` directory for isolation
- [ ] Write `server/grpc/grpc-server.ts` (not imported anywhere yet)
- [ ] Write `server/grpc/handlers.ts` with stub implementations

**Verification:**
- [ ] Dashboard still loads and works
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] `pnpm build` succeeds

---

## Phase 2: Test gRPC Server Independently

**Goal:** Start gRPC server on different port, verify it works, dashboard unaffected

**Tasks:**
- [ ] Modify `server/_core/index.ts` to optionally start gRPC server
- [ ] Use environment variable `ENABLE_GRPC=true` to control it
- [ ] Default `ENABLE_GRPC=false` so dashboard works normally
- [ ] Start gRPC on port 50051 (separate from web server port 3000)
- [ ] Create `server/grpc/test-client.ts` to test gRPC server directly
- [ ] Test all RPCs work with test client

**Verification:**
- [ ] Dashboard works with `ENABLE_GRPC=false` (default)
- [ ] gRPC server starts with `ENABLE_GRPC=true`
- [ ] Test client can call gRPC RPCs successfully
- [ ] No interference between web server and gRPC server

---

## Phase 3: Add gRPC Client Library (No UI Changes)

**Goal:** Generate client code and create wrapper, but don't use it yet

**Tasks:**
- [ ] Install grpc-web dependencies (`grpc-web`, `google-protobuf`)
- [ ] Generate grpc-web client code with proper configuration
- [ ] Verify generated files have correct exports
- [ ] Create `client/src/lib/grpc/grpc-client.ts` wrapper
- [ ] Create `client/src/lib/grpc/grpc-hooks.ts` with React hooks
- [ ] DO NOT import these files anywhere yet
- [ ] Test compilation: `pnpm build` should succeed

**Verification:**
- [ ] Dashboard still works exactly as before
- [ ] Generated gRPC client files exist
- [ ] No import errors
- [ ] TypeScript compilation succeeds

---

## Phase 4: Create ONE Demo gRPC Component

**Goal:** Add a single new component using gRPC, alongside existing components

**Tasks:**
- [ ] Create `client/src/components/GrpcStatusDemo.tsx`
- [ ] Component calls gRPC `GetStatus` RPC
- [ ] Add component to Dashboard in a NEW section (not replacing anything)
- [ ] Wrap in error boundary so failures don't break page
- [ ] Test with gRPC server enabled and disabled

**Verification:**
- [ ] Dashboard loads and works
- [ ] Demo component shows gRPC data when server enabled
- [ ] Demo component shows error message when server disabled
- [ ] All existing components still work
- [ ] No console errors

---

## Phase 5: Gradual Component Migration

**Goal:** Migrate components ONE AT A TIME with testing between each

**Migration Order:**
1. DeviceStatusMonitor (read-only, safe)
2. FrequencyControl (read-write, test carefully)
3. GainControl (read-write, test carefully)
4. StreamingControl (critical, test extensively)
5. Other components as needed

**Process for EACH component:**
- [ ] Create new gRPC version: `ComponentNameGrpc.tsx`
- [ ] Add feature flag: `USE_GRPC_[COMPONENT]=false` by default
- [ ] Test new component works
- [ ] Test old component still works
- [ ] Switch feature flag to true
- [ ] Test thoroughly
- [ ] Save checkpoint
- [ ] Move to next component

**Verification After EACH Component:**
- [ ] Dashboard loads
- [ ] New gRPC component works
- [ ] Old tRPC components still work
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Save checkpoint

---

## Phase 6: Final Verification & Cleanup

**Goal:** Remove old code, finalize migration

**Tasks:**
- [ ] Verify all components using gRPC
- [ ] Remove old tRPC-based components
- [ ] Remove feature flags
- [ ] Update documentation
- [ ] Final testing of all features
- [ ] Save final checkpoint

**Verification:**
- [ ] Complete end-to-end testing
- [ ] All features work via gRPC
- [ ] No dead code remaining
- [ ] Documentation updated
- [ ] Ready for Holoscan backend integration

---

## Rollback Plan

**If anything breaks at ANY phase:**
1. Immediately revert last changes
2. Save checkpoint of working state
3. Analyze what went wrong
4. Fix issue in isolation
5. Test fix before applying to main code

**Emergency Rollback:**
- Use `webdev_rollback_checkpoint` to previous working version
- Never proceed to next phase if current phase has issues

---

## Success Criteria

✅ Dashboard accessible and functional throughout entire migration
✅ Each phase tested and verified before proceeding
✅ Checkpoints saved at each major milestone
✅ gRPC server and client working correctly
✅ Ready for Holoscan C++ backend integration
