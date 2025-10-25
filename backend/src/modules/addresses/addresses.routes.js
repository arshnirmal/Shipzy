// services/backend/src/modules/addresses/addresses.routes.js
import addressesController from "./addresses.controller.js";

async function addressesRoutes(fastify, options) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // POST /api/v1/addresses/search - Search places (step 1)
  fastify.post(
    "/search",
    {
      schema: {
        body: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", minLength: 3 },
            proximity: { type: "string" }, // 'lon,lat'
            limit: { type: "integer", minimum: 1, maximum: 10, default: 10 },
          },
        },
      },
    },
    addressesController.searchAddresses.bind(addressesController),
  );

  // POST /api/v1/addresses/retrieve - Retrieve place details (step 2)
  fastify.post(
    "/retrieve",
    {
      schema: {
        body: {
          type: "object",
          required: ["mapboxId", "sessionToken"],
          properties: {
            mapboxId: { type: "string" },
            sessionToken: { type: "string" },
          },
        },
      },
    },
    addressesController.retrievePlace.bind(addressesController),
  );

  // POST /api/v1/addresses/reverse-geocode
  fastify.post(
    "/reverse-geocode",
    {
      schema: {
        body: {
          type: "object",
          required: ["latitude", "longitude"],
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
          },
        },
      },
    },
    addressesController.reverseGeocode.bind(addressesController),
  );

  // POST /api/v1/addresses/directions
  fastify.post(
    "/directions",
    {
      schema: {
        body: {
          type: "object",
          required: ["origin", "destination"],
          properties: {
            origin: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
              },
            },
            destination: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
              },
            },
            profile: {
              type: "string",
              enum: ["driving", "walking", "cycling"],
              default: "driving",
            },
          },
        },
      },
    },
    addressesController.getDirections.bind(addressesController),
  );

  // POST /api/v1/addresses/distance
  fastify.post(
    "/distance",
    {
      schema: {
        body: {
          type: "object",
          required: ["lat1", "lon1", "lat2", "lon2"],
          properties: {
            lat1: { type: "number" },
            lon1: { type: "number" },
            lat2: { type: "number" },
            lon2: { type: "number" },
          },
        },
      },
    },
    addressesController.calculateDistance.bind(addressesController),
  );
}

export default addressesRoutes;
