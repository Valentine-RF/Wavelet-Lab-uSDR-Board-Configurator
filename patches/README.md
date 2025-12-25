# Dependency Patches

This directory contains pnpm patches applied to third-party dependencies.

## wouter@3.7.1.patch

### Purpose
This patch modifies the wouter router's `Switch` component to expose registered route paths to `window.__WOUTER_ROUTES__` at runtime.

### Why It's Needed
The patch enables runtime inspection of all registered routes, which is useful for:
- **Analytics integration**: Track which routes are available in the SPA
- **Server-side configuration**: Allow the server to know about client routes for proper SSR/SSG handling
- **Debugging**: Developers can inspect `window.__WOUTER_ROUTES__` in the console to see all registered paths
- **Navigation guards**: Enable dynamic route validation

### What It Changes
The patch adds code to the `Switch` component that:
1. Checks if running in a browser environment (`typeof window !== 'undefined'`)
2. Initializes `window.__WOUTER_ROUTES__` array if not present
3. Collects all route paths from child `Route` components
4. Deduplicates and stores paths in the global array

### Maintenance Notes
- This patch targets wouter version 3.7.1
- When upgrading wouter, this patch may need to be regenerated
- To regenerate: `pnpm patch wouter@<new-version>`, apply changes, then `pnpm patch-commit`

## Other Overrides

### tailwindcss > nanoid: 3.3.7
Pins nanoid version for tailwindcss to 3.3.7 to avoid compatibility issues with certain build environments that don't support newer nanoid ES module syntax.
