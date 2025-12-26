# Multi-stage build for uSDR Development Board Dashboard
FROM node:22.13.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Build the application (compiles frontend and bundles server)
RUN pnpm build

# Production stage - minimal image
FROM node:22.13.0-alpine

# Install wget for health checks (lighter than spawning node)
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy only built artifacts from builder stage
# - dist/ contains compiled frontend (public/) and bundled server (index.js)
# - drizzle/ needed for database migrations at runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check using wget (more efficient than spawning node)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "start"]
