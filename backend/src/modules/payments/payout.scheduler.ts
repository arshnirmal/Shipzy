// services/backend/src/modules/payments/payout.scheduler.ts
// Daily payout scheduler — runs at configured hour (default: 11 PM IST)
// Processes all unsettled driver earnings and initiates batch payouts

import type { FastifyInstance } from "fastify";
import config from "../../config/env.js";
import logger from "../../config/logger.js";
import paymentsService from "./payments.service.js";

/**
 * Start the daily payout scheduler.
 * Checks every 5 minutes if the current hour matches the payout hour.
 * When it matches and hasn't already run today, processes payouts.
 */
export function startPayoutScheduler(fastify: FastifyInstance): void {
  let lastPayoutDate: string | null = null;

  const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
  const payoutHour = config.payments.payoutScheduleHour;

  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours(); // Local server time
      const today = now.toISOString().split("T")[0] || "";

      // Only run at the configured hour, and only once per day
      if (currentHour === payoutHour && lastPayoutDate !== today) {
        logger.info({
          msg: "Payout scheduler triggered",
          hour: payoutHour,
          date: today,
        });

        lastPayoutDate = today;
        await paymentsService.processDailyPayouts();

        logger.info({
          msg: "Payout scheduler completed",
          date: today,
        });
      }
    } catch (err) {
      logger.error({
        msg: "Payout scheduler error",
        error: (err as Error).message,
      });
    }
  }, CHECK_INTERVAL_MS);

  logger.info({
    msg: "Payout scheduler started",
    payoutHour,
    checkIntervalMs: CHECK_INTERVAL_MS,
  });
}
