import { z } from "zod";
import logger from "../config/logger.js";
import { AppError } from "./error.util.js";

export const parseDbRow = <T>(
  schema: z.ZodType<T>,
  row: unknown,
  entity: string,
): T => {
  const parsed = schema.safeParse(row);
  if (!parsed.success) {
    logger.error({
      msg: `Invalid ${entity} row shape`,
      issues: parsed.error.issues,
    });
    throw new AppError(`Invalid ${entity} row shape`, 500);
  }

  return parsed.data;
};

export const parseDbRows = <T>(
  schema: z.ZodType<T>,
  rows: unknown[],
  entity: string,
): T[] => {
  const parsed = z.array(schema).safeParse(rows);
  if (!parsed.success) {
    logger.error({
      msg: `Invalid ${entity} rows shape`,
      issues: parsed.error.issues,
    });
    throw new AppError(`Invalid ${entity} rows shape`, 500);
  }

  return parsed.data;
};
