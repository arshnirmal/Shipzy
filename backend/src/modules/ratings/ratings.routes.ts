import { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/auth.middleware.js";
import ratingsController from "./ratings.controller.js";
import {
  createRatingSchema,
  getDriverRatingStatsSchema,
} from "./ratings.schema.js";

async function ratingsRoutes(fastify: FastifyInstance, _options: unknown) {
  // All ratings routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // POST /api/v1/ratings/orders/:orderId - Customer rates delivered order
  fastify.post(
    "/orders/:orderId",
    {
      schema: createRatingSchema,
      onRequest: [authorize("client")],
    },
    ratingsController.createRating.bind(ratingsController) as any,
  );

  // GET /api/v1/ratings/drivers/:driverId - Driver rating statistics
  fastify.get(
    "/drivers/:driverId",
    {
      schema: getDriverRatingStatsSchema,
      onRequest: [authorize("client", "courier", "admin", "business")],
    },
    ratingsController.getDriverRatingStats.bind(ratingsController) as any,
  );
}

export default ratingsRoutes;
