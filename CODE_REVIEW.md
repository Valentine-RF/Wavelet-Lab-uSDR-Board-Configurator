# Code Review Report

**Repository**: Wavelet-Lab-uSDR-Board-Configurator
**Date**: 2025-12-25
**Reviewer**: Claude (Automated Review)

---

## Executive Summary

This code review covers the uSDR Development Board Dashboard, a React 19 + Express/tRPC web application for configuring Wavelet Lab SDR hardware. The codebase is well-structured overall but contains several critical security vulnerabilities that require immediate attention.

**Overall Assessment**: 6/10 - Functional but requires security fixes before production deployment.

---

## Critical Security Issues

### 1. Command Injection in Terminal Execution
**Severity**: CRITICAL
**File**: `server/routers.ts:61`

```typescript
spawn('gnome-terminal', ['--', 'bash', '-c', `${input.command}; echo...`], {
```

**Issue**: User-provided command string is passed directly to shell without sanitization.
**Impact**: Allows arbitrary command execution on the server.
**Fix**: Implement command whitelist, input validation, or remove feature entirely.

---

### 2. Command Injection in Device Control
**Severity**: CRITICAL
**File**: `server/deviceControl.ts:109`

```typescript
args.push(`-f ${config.outputPath}`);
```

**Issue**: `outputPath` and `txFile` from user input are interpolated directly into commands.
**Impact**: Path traversal and command injection via crafted filenames.
**Fix**: Validate and sanitize paths, use absolute paths only, escape shell metacharacters.

---

### 3. WebSocket Authentication Bypass
**Severity**: HIGH
**File**: `server/streamingServer.ts:47`

```typescript
const userId = parseInt(userIdStr, 10);
// userId is trusted without validation against authenticated session
```

**Issue**: User ID from query parameters is trusted without cross-referencing the authenticated session.
**Impact**: Any authenticated user could potentially access another user's streaming session.
**Fix**: Verify `userId` matches the database record's `userId` for the session.

---

### 4. Unsafe CSP Configuration
**Severity**: MEDIUM
**File**: `server/_core/securityHeaders.ts:15`

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'"
```

**Issue**: `unsafe-eval` allows code execution from string evaluation.
**Impact**: Increases XSS attack surface.
**Fix**: Remove `unsafe-eval` and refactor code that requires it.

---

### 5. Default Credentials
**Severity**: LOW
**Files**: `.env.example`, `docker-compose.yml`

**Issue**: Default passwords like `changeme` are used in examples.
**Impact**: Developers may accidentally deploy with weak credentials.
**Fix**: Add deployment checklist, use secrets management.

---

## Code Quality Issues

### Large Components
| File | Lines | Issue |
|------|-------|-------|
| `Dashboard.tsx` | 745 | Should be split into smaller components |
| `commandTemplates.ts` | 22050 | Consider code generation or database storage |

### Type Safety Problems
- `routers.ts:126` - Uses `any` type for updates object
- Multiple schemas use `z.any()` for configuration objects
- Missing return type annotations on exported functions

### Code Duplication
- `createAuthContext()` duplicated in all 6 test files
- Similar validation logic repeated across components

### Magic Numbers
```typescript
// Examples of hardcoded values that should be constants:
setTimeout(() => { ... }, 5000);  // Why 5000?
app.use(express.json({ limit: "50mb" }));  // Document rationale
for (let port = startPort; port < startPort + 20; port++)  // Why 20?
```

---

## Database Issues

### Missing Foreign Keys
The schema lacks foreign key constraints:
```typescript
// deviceConfigs has userId but no FK constraint
userId: int("userId").notNull(),
// Should be:
userId: int("userId").notNull().references(() => users.id),
```

### Missing Indexes
Frequently queried columns lack indexes:
- `device_configs.userId`
- `streaming_sessions.sessionId`
- `command_history.userId`

### Connection Management
```typescript
// Current: Creates new connection per request
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
}
```
Consider using a connection pool for production.

---

## Testing Issues

### Coverage Gaps
- No React component tests exist
- No end-to-end tests
- Tests use real database (should use mocks or test DB)

### Test Isolation
Tests may leave data in database, affecting subsequent runs.

---

## Performance Issues

### No Rate Limiting
API endpoints lack rate limiting, allowing potential DoS.

### Inefficient WebSocket Broadcasting
```typescript
for (const [clientId, client] of Array.from(this.clients.entries())) {
  // O(n) for each message broadcast
}
```
Consider using session-indexed maps for O(1) lookups.

---

## UI/UX Issues

### Layout Bug
```tsx
<TabsList className="grid w-full grid-cols-5">
  {/* 7 TabsTriggers but only 5 columns */}
</TabsList>
```

### Poor UX Patterns
- Browser `prompt()` used instead of proper modal dialogs
- Missing loading states in some components
- No offline/error states for WebSocket connections

### Accessibility
- Missing ARIA labels on interactive elements
- Insufficient color contrast in some themes

---

## Docker/DevOps Issues

### Dockerfile Optimization
```dockerfile
# Copies source files to production image - unnecessary
COPY --from=builder /app/server ./server
```

### Health Check Efficiency
```dockerfile
# Uses Node.js for health check - heavyweight
CMD node -e "require('http').get(...)"
# Better: Use wget or curl
```

### Hardcoded Configuration
```typescript
hmr: {
  host: '3000-i5j10nwfez5sbvu0s9zcm-120751f5.manusvm.computer',
}
```
**FIXED**: Now configurable via `VITE_HMR_HOST` environment variable.

---

## Action Items (Priority Order)

### P0 - Critical (Fix Immediately)
1. [x] ~~Fix command injection in `terminal.executeCommand`~~ **FIXED** - Added command whitelist and argument validation
2. [x] ~~Fix command injection in `deviceControl.buildCommand`~~ **FIXED** - Added path validation and safe argument handling
3. [x] ~~Fix WebSocket authentication bypass~~ **FIXED** - Added session ownership verification

### P1 - High (Fix Before Production)
4. [x] ~~Remove `unsafe-eval` from CSP~~ **FIXED** - Removed in production, kept for dev HMR
5. [x] ~~Add rate limiting to API~~ **FIXED** - Created `server/_core/rateLimit.ts` with configurable limits
6. [x] ~~Add database indexes~~ **FIXED** - Added indexes on userId, sessionId, timestamp columns
7. [x] ~~Implement proper connection pooling~~ **FIXED** - Added mysql2 pool with configurable limits in `db.ts`
8. [x] ~~Add WebSocket error handling~~ **FIXED** - Added reconnection logic and error states in `StreamingControl.tsx`

### P2 - Medium (Technical Debt)
8. [ ] Refactor Dashboard.tsx into smaller components
9. [x] ~~Add foreign key constraints~~ **FIXED** - Added FK constraints with cascade delete
10. [x] ~~Replace `any` types with proper types~~ **FIXED** - Created typed schemas and Record types
11. [x] ~~Extract shared test utilities~~ **FIXED** - Created `server/test-utils.ts`
12. [ ] Add React component tests

### P3 - Low (Nice to Have)
13. [ ] Add JSDoc documentation
14. [x] ~~Optimize Docker image size~~ **FIXED** - Removed source dirs, use wget for health check
15. [x] ~~Fix tab layout mismatch~~ **FIXED** - grid-cols-5 → grid-cols-7
16. [ ] Add ARIA accessibility labels
17. [ ] Replace browser prompts with modals
18. [x] ~~Document wouter patch~~ **FIXED** - Added `patches/README.md`
19. [x] ~~Extract magic numbers~~ **FIXED** - Created `server/constants.ts`
20. [x] ~~Secure default credentials~~ **FIXED** - Updated .env.example and docker-compose.yml

---

## Positive Observations

- **Well-structured tRPC setup** with proper middleware and context
- **Good use of Zod** for input validation (though needs expansion)
- **Comprehensive schema design** for SDR configuration
- **Security headers middleware** is a good foundation
- **Test coverage exists** for core server functionality
- **Clean separation** between client and server code
- **Good use of TypeScript** throughout most of the codebase

---

## Recommendations

1. **Security Audit**: Engage professional security review before production
2. **Automated Testing**: Add CI/CD with test coverage requirements
3. **Documentation**: Add API documentation using OpenAPI/Swagger
4. **Monitoring**: Add logging and monitoring for production deployment
5. **Code Review Process**: Implement PR reviews for all changes

---

*This review was generated automatically and should be verified by human reviewers.*
