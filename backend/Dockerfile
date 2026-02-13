# ============================================
# Shipzy Backend Dockerfile
# ============================================

# ============================================
# Base Stage
# ============================================
FROM node:20-alpine AS base

# Install system dependencies and enable corepack
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    wget && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ============================================
# Dependencies Stage (with build tools)
# ============================================
FROM base AS deps

# Install build tools only for this stage
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod=false

# ============================================
# Builder Stage
# ============================================
FROM base AS builder

# Install build tools for TypeScript compilation
RUN apk add --no-cache python3 make g++

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN pnpm run build

# ============================================
# Production Dependencies Stage
# ============================================
FROM base AS prod-deps

# Install build tools temporarily for native module rebuild
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Rebuild native modules for production
RUN pnpm rebuild || true

# ============================================
# Production Stage
# ============================================
FROM base AS runner

WORKDIR /app

# Install build tools temporarily for native module rebuild
# Create non-root user (but don't switch yet - need root for rebuild)
RUN apk add --no-cache python3 make g++ && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Set production environment
ENV NODE_ENV=production

# Copy package files first
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Rebuild native modules in production stage to ensure compatibility
# This is necessary because pnpm's structure may not preserve native bindings correctly
RUN pnpm rebuild || true

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Remove build tools to reduce image size and change ownership to nodejs user
RUN apk del python3 make g++ && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check (using wget which is more reliable in Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init as PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start production server
CMD ["node", "dist/server.js"]