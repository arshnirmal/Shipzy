// services/backend/src/middleware/validate.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { ValidationError } from "../utils/error.util";

/**
 * Custom validation middleware for additional checks
 */
export const validateRequest = (schema: any) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      // Custom validation logic can go here
      // Fastify already handles schema validation, but you can add extra checks

      // Example: Validate phone number format
      if ((request.body as any)?.phoneNumber) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test((request.body as any).phoneNumber)) {
          throw new ValidationError("Invalid phone number format");
        }
      }

      // Example: Validate UUID format
      if ((request.params as any)?.id) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test((request.params as any).id)) {
          throw new ValidationError("Invalid UUID format");
        }
      }
    } catch (error) {
      throw error;
    }
  };
};
