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
  mapbox: {
    accessToken: string;
    baseUrl: string;
  };
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  logging: LoggerConfig & { logQueries: boolean };
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    accountNumber: string;
  };
  payments: {
    driverCommissionPct: number;
    payoutScheduleHour: number;
    qrExpiryMinutes: number;
  };
}

const config: Config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",

  // Database
  database: {
    connectionString: process.env.DATABASE_URL || undefined,
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

  // Mapbox
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN || "",
    baseUrl: process.env.MAPBOX_BASE_URL || "https://api.mapbox.com",
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

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER || "",
  },

  // Payment Settings
  payments: {
    driverCommissionPct: parseFloat(process.env.DRIVER_COMMISSION_PCT || "15"),
    payoutScheduleHour: parseInt(process.env.PAYOUT_SCHEDULE_HOUR || "23", 10),
    qrExpiryMinutes: parseInt(process.env.QR_EXPIRY_MINUTES || "30", 10),
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
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

// Allow DATABASE_URL as an alternative to DB_PASSWORD-based split DB credentials.
if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  missingEnvVars.push("DB_PASSWORD (or DATABASE_URL)");
}

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

// Razorpay credentials are required outside of tests (where the provider is mocked).
if (process.env.NODE_ENV !== "test") {
  const missingPaymentVars = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ].filter((varName) => !process.env[varName]);

  if (missingPaymentVars.length > 0) {
    throw new Error(
      `Missing required payment environment variables: ${missingPaymentVars.join(", ")}`,
    );
  }
}

export default config;
