import { FastifyInstance } from "fastify";
import { buildApp } from "./app";
import config from "./config/env";
import logger from "./config/logger";
import db from "./database/db";

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
      `API Documentation: http://${config.host}:${config.port}/api/v1`,
    );
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
