import { FastifyInstance } from "fastify";

// Extend FastifyInstance with custom decorators
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export interface DeviceInfo {
  deviceId?: string;
  ipAddress: string;
  userAgent?: string;
}

export interface UserRole {
  id: number;
  name: string;
  permissions: string[];
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl?: { rejectUnauthorized: boolean };
}

export interface CorsConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
}

export interface RateLimitConfig {
  max: number;
  timeWindow: string | number;
  skipOnError: boolean;
  keyGenerator: (request: any) => string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

export interface LoggerConfig {
  level: string;
  prettyPrint: boolean;
  redact: string[];
}
