// services/backend/src/utils/response.util.js

/**
 * Success response
 * @param {Object} reply - Fastify reply
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export const successResponse = (reply, data, message = 'Success', statusCode = 200) => {
    return reply.status(statusCode).send({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Error response
 * @param {Object} reply - Fastify reply
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} errors - Validation errors
 */
export const errorResponse = (reply, message, statusCode = 400, errors = null) => {
    return reply.status(statusCode).send({
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Paginated response
 * @param {Object} reply - Fastify reply
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination metadata
 */
export const paginatedResponse = (reply, data, pagination) => {
    return reply.status(200).send({
        success: true,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
        timestamp: new Date().toISOString(),
    });
};

