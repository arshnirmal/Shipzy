// services/backend/src/config/env.js
import dotenv from "dotenv";

dotenv.config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || "0.0.0.0",

  // Database
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || "shipzy_dev",
    user: process.env.DB_USER || "shipzy_user",
    password: process.env.DB_PASSWORD,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // Firebase (now using service account key file)
  firebase: {
    // These are no longer needed as we're using the service account key file directly
    projectId: null,
    clientEmail: null,
    privateKey: null,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW, 10) || 60000,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    logQueries: process.env.LOG_QUERIES === "true",
  },
};

// Validation
const requiredEnvVars = [
  "DB_PASSWORD",
  "JWT_SECRET",
  // Firebase credentials are now handled via service account key file
  // 'FIREBASE_PROJECT_ID',
  // 'FIREBASE_CLIENT_EMAIL',
  // 'FIREBASE_PRIVATE_KEY',
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
