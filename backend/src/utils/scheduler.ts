import type { FastifyInstance } from "fastify";
import ordersService from "../modules/orders/orders.service.js";

export function startScheduler(fastify: FastifyInstance): void {
  setInterval(async () => {
    try {
      await ordersService.releaseScheduledOrders();
    } catch (err) {
      fastify.log.error({ err }, "scheduler: releaseScheduledOrders failed");
    }
  }, 5 * 60 * 1000); // every 5 minutes
}
