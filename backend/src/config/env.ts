// services/backend/src/config/env.ts
import dotenv from "dotenv";
import type {
  DatabaseConfig,
  CorsConfig,
  JWTConfig,
  FirebaseConfig,
  LoggerConfig,
} from "../types/index.js";

dotenv.config();

interface RateLimitConfig {
  max: number;
  timeWindow: number;
}

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  database: DatabaseConfig;
  jwt: JWTConfig & { refreshExpiresIn: string };
  firebase: FirebaseConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  logging: LoggerConfig & { logQueries: boolean };
}

const config: Config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",

  // Database
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "shipzy_dev",
    user: process.env.DB_USER || "shipzy_user",
    password: process.env.DB_PASSWORD || "",
    max: parseInt(process.env.DB_POOL_MAX || "20", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl:
      process.env.DB_SSL === "true" ||
      process.env.DB_SSL === "require" ||
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || "60000", 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    prettyPrint: process.env.NODE_ENV === "development",
    logQueries: process.env.LOG_QUERIES === "true",
    redact: ["password", "token", "authorization"],
  },
};

// Validation
const requiredEnvVars = [
  "JWT_SECRET",
  "MAPBOX_ACCESS_TOKEN",
  // Firebase credentials (optional if using service account file, required for cloud deployment)
  // 'FIREBASE_PROJECT_ID',
  // 'FIREBASE_CLIENT_EMAIL',
  // 'FIREBASE_PRIVATE_KEY',
  // DB_PASSWORD is optional and defaults to empty string
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

export default config;
