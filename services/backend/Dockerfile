# ============================================
# Shipzy Backend Dockerfile
# Multi-stage build for development and production
# ============================================

# ============================================
# Base Stage - Common dependencies
# ============================================
FROM node:lts-alpine AS base

# Install system dependencies and build tools for native modules
# Update package index first to avoid stale mirrors
RUN apk update && apk add --no-cache \
    wget \
    curl \
    bash \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# ============================================
# Development Stage
# ============================================
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY src ./src

# Copy Firebase service account key file
COPY shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json ./

# DON'T copy source code - it will be mounted via docker-compose
# This allows hot reload to work properly

# Expose port
EXPOSE 3000

# Start with hot reload
CMD ["npm", "run", "dev"]

# ============================================
# Production Builder Stage
# ============================================
FROM base AS production-builder

# Install only production dependencies
RUN npm ci --only=production

# Copy source code and Firebase service account key file
COPY . .
COPY shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json .

# ============================================
# Production Stage
# ============================================
FROM node:lts-alpine AS production

# Install runtime dependencies only
RUN apk update && apk add --no-cache \
    wget \
    curl \
    libstdc++

WORKDIR /app

# Copy dependencies and files from builder
COPY --from=production-builder /app/node_modules ./node_modules
COPY --from=production-builder /app/src ./src
COPY --from=production-builder /app/package*.json ./
COPY --from=production-builder /app/shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start production server
CMD ["npm", "start"]
