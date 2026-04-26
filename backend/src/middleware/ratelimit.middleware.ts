// services/backend/src/middleware/ratelimit.middleware.ts
import { FastifyRequest } from "fastify";
import config from "../config/env.js";

const LOCALHOST_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function normalizeIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

function isPrivateNetworkIp(ip: string): boolean {
  const normalizedIp = normalizeIp(ip);

  if (LOCALHOST_IPS.has(ip) || LOCALHOST_IPS.has(normalizedIp)) {
    return true;
  }

  // Common private IPv4 CIDRs used by Docker and local networks.
  const parts = normalizedIp.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const a = parts[0]!;
  const b = parts[1]!;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16

  return false;
}

function getClientIp(request: FastifyRequest): string {
  const forwardedFor = request.headers["x-forwarded-for"] as string | undefined;
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers["x-real-ip"] as string | undefined;
  if (realIp) return realIp.trim();

  return request.ip;
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  global: true,
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
  cache: 10000,
  // In dev/test, don't rate limit localhost or private Docker/local-network traffic.
  // Never skip rate limiting in production.
  allowList: (request: FastifyRequest) => {
    if (config.nodeEnv === "production") return false;
    return isPrivateNetworkIp(getClientIp(request));
  },
  redis: null, // Add Redis connection here if using Redis
  nameSpace: "shipzy-rate-limit:",
  continueExceeding: true,
  skipOnError: true,

  keyGenerator: (request: FastifyRequest): string => {
    return getClientIp(request);
  },

  errorResponseBuilder: (request: FastifyRequest, context: any) => {
    return {
      statusCode: context.statusCode,
      success: false,
      message: "Rate limit exceeded",
      retryAfter: context.after,
      timestamp: new Date().toISOString(),
    };
  },
};
