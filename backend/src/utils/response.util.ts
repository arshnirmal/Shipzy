// services/backend/src/utils/response.util.ts
import { FastifyReply } from "fastify";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/**
 * Success response
 * @param reply - Fastify reply
 * @param data - Response data
 * @param message - Success message
 * @param statusCode - HTTP status code
 */
export const successResponse = <T = unknown>(
  reply: FastifyReply,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
): FastifyReply => {
  return reply.status(statusCode).send({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response
 * @param reply - Fastify reply
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param errors - Validation errors
 */
export const errorResponse = (
  reply: FastifyReply,
  message: string,
  statusCode: number = 400,
  errors: unknown = null,
): FastifyReply => {
  return reply.status(statusCode).send({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Paginated response
 * Shape: { success, message, data, meta: { pagination }, timestamp }
 * @param reply - Fastify reply
 * @param data - Response data
 * @param pagination - Pagination metadata
 * @param message - Human-readable message
 */
export const paginatedResponse = <T = unknown>(
  reply: FastifyReply,
  data: T[],
  pagination: PaginationMeta,
  message: string = "Success",
): FastifyReply => {
  return reply.status(200).send({
    success: true,
    message,
    data,
    meta: {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages ?? Math.ceil(pagination.total / pagination.limit),
      },
    },
    timestamp: new Date().toISOString(),
  });
};
