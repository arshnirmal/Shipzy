// services/backend/src/modules/addresses/addresses.routes.ts
import { FastifyInstance } from "fastify";
import addressesController from "./addresses.controller.js";
import {
  searchAddressesSchema,
  reverseGeocodeSchema,
  retrievePlaceSchema,
  getDirectionsSchema,
  calculateDistanceSchema,
} from "./addresses.schema.js";

async function addressesRoutes(fastify: FastifyInstance, _options: unknown) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post(
    "/search",
    { schema: searchAddressesSchema },
    addressesController.searchAddresses.bind(addressesController),
  );

  fastify.post(
    "/retrieve",
    { schema: retrievePlaceSchema },
    addressesController.retrievePlace.bind(addressesController),
  );

  fastify.post(
    "/reverse-geocode",
    { schema: reverseGeocodeSchema },
    addressesController.reverseGeocode.bind(addressesController),
  );

  fastify.post(
    "/directions",
    { schema: getDirectionsSchema },
    addressesController.getDirections.bind(addressesController),
  );

  fastify.post(
    "/distance",
    { schema: calculateDistanceSchema },
    addressesController.calculateDistance.bind(addressesController),
  );
}

export default addressesRoutes;
