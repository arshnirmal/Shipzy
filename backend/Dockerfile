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
    python3 \
    make \
    g++ \
    dumb-init && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# ============================================
# Builder Stage
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN pnpm run build

# ============================================
# Production Stage
# ============================================
FROM base AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built artifacts and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# Use dumb-init as PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start production server
CMD ["node", "dist/src/server.js"]

