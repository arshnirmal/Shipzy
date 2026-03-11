// services/backend/src/utils/validation.util.ts
import { z } from "zod";
import { ValidationError } from "./error.util.js";

/**
 * Validate data using Zod schema and throw ValidationError if invalid
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context for error messages
 */
export const validateOrThrow = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = "validation"
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));
      
      throw new ValidationError(
        `Validation failed in ${context}: ${errors.map((e: any) => e.field).join(", ")}`,
        errors
      );
    }
    throw new ValidationError(`Validation failed in ${context}: ${(error as Error).message}`);
  }
};

/**
 * Sanitize and validate JSONB data
 * @param data - Raw JSON data
 * @param schema - Zod schema for validation
 * @param context - Context for error messages
 */
export const validateJSONB = <T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string = "JSONB validation"
): T => {
  if (data === null || data === undefined) {
    throw new ValidationError(`${context}: Data cannot be null or undefined`);
  }

  if (typeof data !== "object") {
    throw new ValidationError(`${context}: Data must be an object`);
  }

  return validateOrThrow(schema, data, context);
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (lat: number, lng: number, context: string = "coordinates"): void => {
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new ValidationError(`${context}: Latitude and longitude must be numbers`);
  }

  if (lat < -90 || lat > 90) {
    throw new ValidationError(`${context}: Latitude must be between -90 and 90`);
  }

  if (lng < -180 || lng > 180) {
    throw new ValidationError(`${context}: Longitude must be between -180 and 180`);
  }
};

/**
 * Validate positive integer
 */
export const validatePositiveInt = (
  value: number,
  fieldName: string = "value"
): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
  return value;
};

/**
 * Validate non-empty string
 */
export const validateNonEmptyString = (
  value: string,
  fieldName: string = "value"
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
};
