// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";
import {
  ActiveAssignmentsResponseZ,
  DriverAvailabilityResponseZ,
  DriverEarningsSummaryResponseZ,
  DriverLocationResponseZ,
  DriverProfileMutationResponseZ,
  EarningsPeriodQueryZ,
  DriverProfileResponseZ,
  DriverRatingResponseZ,
  UpdateDriverProfileRequestZ,
  UpdateAvailabilityRequestZ,
  UpdateLocationRequestZ,
  TripHistoryQueryZ,
  TripHistoryResponseZ,
} from "./drivers.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const UpdateDriverProfileJson = toJsonSchema(UpdateDriverProfileRequestZ);
const UpdateAvailabilityJson = toJsonSchema(UpdateAvailabilityRequestZ);
const UpdateLocationJson = toJsonSchema(UpdateLocationRequestZ);
const DriverProfileResponseJson = toJsonSchema(DriverProfileResponseZ);
const DriverProfileMutationResponseJson = toJsonSchema(
  DriverProfileMutationResponseZ,
);
const DriverAvailabilityResponseJson = toJsonSchema(
  DriverAvailabilityResponseZ,
);
const DriverLocationResponseJson = toJsonSchema(DriverLocationResponseZ);
const ActiveAssignmentsResponseJson = toJsonSchema(ActiveAssignmentsResponseZ);
const DriverEarningsSummaryResponseJson = toJsonSchema(
  DriverEarningsSummaryResponseZ,
);
const DriverRatingResponseJson = toJsonSchema(DriverRatingResponseZ);
const EarningsPeriodQueryJson = toJsonSchema(EarningsPeriodQueryZ);
const TripHistoryQueryJson = toJsonSchema(TripHistoryQueryZ);
const TripHistoryResponseJson = toJsonSchema(TripHistoryResponseZ);

export const getDriverProfileSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverProfileResponseJson),
  },
};

export const updateDriverProfileSchema: FastifySchema = {
  body: UpdateDriverProfileJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverProfileMutationResponseJson),
  },
};

export const updateAvailabilitySchema: FastifySchema = {
  body: UpdateAvailabilityJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverAvailabilityResponseJson),
  },
};

export const updateLocationSchema: FastifySchema = {
  body: UpdateLocationJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverLocationResponseJson),
  },
};

export const getActiveAssignmentsSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(ActiveAssignmentsResponseJson),
  },
};

export const getEarningsSchema: FastifySchema = {
  querystring: EarningsPeriodQueryJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverEarningsSummaryResponseJson),
  },
};

export const getDriverRatingSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverRatingResponseJson),
  },
};

export const getTripHistorySchema: FastifySchema = {
  querystring: TripHistoryQueryJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(TripHistoryResponseJson),
  },
};
