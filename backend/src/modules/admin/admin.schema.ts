import { FastifySchema } from "fastify";
import {
  DriverOnboardingReviewBodyZ,
  DriverOnboardingReviewParamsZ,
  DriverOnboardingReviewResponseZ,
} from "./admin.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  errorEnvelope,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const DriverOnboardingReviewParamsJson = toJsonSchema(
  DriverOnboardingReviewParamsZ,
);
const DriverOnboardingReviewBodyJson = toJsonSchema(
  DriverOnboardingReviewBodyZ,
);
const DriverOnboardingReviewResponseJson = toJsonSchema(
  DriverOnboardingReviewResponseZ,
);

export const driverOnboardingReviewSchema: FastifySchema = {
  params: DriverOnboardingReviewParamsJson,
  body: DriverOnboardingReviewBodyJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    422: errorEnvelope,
    200: successEnvelope(DriverOnboardingReviewResponseJson),
  },
};
