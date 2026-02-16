import { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import config from "./config/env.js";
import logger from "./config/logger.js";
import db from "./database/db.js";
import * as cron from "node-cron";

/**
 * Start the server
 */
const start = async () => {
  let app: FastifyInstance;

  try {
    // Build Fastify app
    app = await buildApp();

    // Start listening
    await app.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`Server listening on ${config.host}:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(
      `API Documentation (UI): http://${config.host}:${config.port}/docs`,
    );
    logger.info(
      `OpenAPI JSON: http://${config.host}:${config.port}/documentation/json`,
    );

    // Self-ping to prevent sleep on free tiers
    cron.schedule("*/5 * * * *", async () => {
      try {
        const response = await app.inject({
          method: "GET",
          url: "/health",
        });
        if (response.statusCode === 200) {
          logger.info("Self-ping successful");
        } else {
          logger.warn(`Self-ping failed with status ${response.statusCode}`);
        }
      } catch (error) {
        logger.error({
          msg: "Self-ping error",
          error: (error as Error).message,
        });
      }
    });
  } catch (error) {
    logger.error({
      msg: "Failed to start server",
      error: (error as Error).message,
    });
    process.exit(1);
  }

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown`);

    try {
      // Close server
      await app.close();
      logger.info("Server closed");

      // Close database connections
      await db.closePool();
      logger.info("Database connections closed");

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error({
        msg: "Error during graceful shutdown",
        error: (error as Error).message,
      });
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    logger.error({
      msg: "Uncaught exception",
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error({
      msg: "Unhandled rejection",
      reason,
      promise,
    });
    gracefulShutdown("UNHANDLED_REJECTION");
  });
};

// Start the server
start();
