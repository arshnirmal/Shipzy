// services/backend/src/middleware/validate.middleware.js
import { ValidationError } from '../utils/error.util.js';

/**
 * Custom validation middleware for additional checks
 */
export const validateRequest = (schema) => {
    return async (request, reply) => {
        try {
            // Custom validation logic can go here
            // Fastify already handles schema validation, but you can add extra checks
            
            // Example: Validate phone number format
            if (request.body?.phoneNumber) {
                const phoneRegex = /^\+?[1-9]\d{1,14}$/;
                if (!phoneRegex.test(request.body.phoneNumber)) {
                    throw new ValidationError('Invalid phone number format');
                }
            }
            
            // Example: Validate UUID format
            if (request.params?.id) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(request.params.id)) {
                    throw new ValidationError('Invalid UUID format');
                }
            }
        } catch (error) {
            throw error;
        }
    };
};
