// services/backend/src/middleware/ratelimit.middleware.js
import config from '../config/env.js';

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: null, // Add Redis connection here if using Redis
    nameSpace: 'shipzy-rate-limit:',
    continueExceeding: true,
    skipOnError: true,
    
    keyGenerator: (request) => {
        return request.headers['x-forwarded-for'] || 
               request.headers['x-real-ip'] || 
               request.ip;
    },
    
    errorResponseBuilder: (request, context) => {
        return {
            success: false,
            message: 'Rate limit exceeded',
            retryAfter: context.after,
            timestamp: new Date().toISOString(),
        };
    },
};

/**
 * Stricter rate limit for auth endpoints
 */
export const authRateLimitConfig = {
    ...rateLimitConfig,
    max: 10,
    timeWindow: '15 minutes',
};

