// services/backend/src/config/logger.ts
import pino from "pino";
import config from "./env";

const logger = pino({
  level: config.logging.level,
  ...(config.nodeEnv === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export default logger;
