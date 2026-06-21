// services/backend/src/modules/payments/qr-expiry.scheduler.ts
// QR expiry sweep — runs every 5 minutes and expires stale collect-on-delivery QR transactions

import type { FastifyInstance } from "fastify";
import logger from "../../config/logger.js";
import paymentsService from "./payments.service.js";

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start the QR expiry sweep scheduler.
 * Every 5 minutes, any pending QR transaction whose qr_expires_at is in the past
 * is flipped to 'expired' so drivers cannot collect payment on a stale QR code.
 */
export function startQrExpirySweep(fastify: FastifyInstance): void {
  setInterval(async () => {
    try {
      await paymentsService.expireStaleQRs();
    } catch (err) {
      logger.error({
        msg: "QR expiry sweep error",
        error: (err as Error).message,
      });
    }
  }, SWEEP_INTERVAL_MS);

  logger.info({
    msg: "QR expiry sweep scheduler started",
    intervalMs: SWEEP_INTERVAL_MS,
  });
}
