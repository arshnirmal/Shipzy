// services/backend/src/app.js
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import config from './config/env.js';
import logger from './config/logger.js';
import { authenticate } from './middleware/auth.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { authRateLimitConfig, rateLimitConfig } from './middleware/ratelimit.middleware.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';

/**
 * Build Fastify application
 */
export const buildApp = async (opts = {}) => {
    const app = Fastify({
        logger: logger,
        trustProxy: true,
        requestIdHeader: 'x-request-id',
        requestIdLogLabel: 'reqId',
        disableRequestLogging: false,
        ajv: {
            customOptions: {
                removeAdditional: 'all',
                coerceTypes: true,
                useDefaults: true,
            },
        },
        ...opts,
    });
    
    // ============ PLUGINS ============
    
    // CORS
    await app.register(cors, {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Request-Id'],
    });
    
    // Security headers
    await app.register(helmet, {
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    });
    
    // Rate limiting
    await app.register(rateLimit, rateLimitConfig);
    
    // ============ DECORATORS ============
    
    // Add authentication decorator
    app.decorate('authenticate', authenticate);
    
    // ============ HOOKS ============
    
    // Request logging
    app.addHook('onRequest', async (request, reply) => {
        request.log.info({
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        }, 'Incoming request');
    });
    
    // Response logging
    app.addHook('onResponse', async (request, reply) => {
        request.log.info({
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime: reply.elapsedTime,
        }, 'Request completed');
    });
    
    // ============ ROUTES ============
    
    // Health check
    app.get('/health', async (request, reply) => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.nodeEnv,
        };
    });
    
    // API version
    app.get('/api/v1', async (request, reply) => {
        return {
            name: 'Shipzy API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        };
    });
    
    // Register module routes
    await app.register(authRoutes, { 
        prefix: '/api/v1/auth',
        config: authRateLimitConfig, // Stricter rate limit for auth
    });
    
    // TODO: Register other module routes
    // await app.register(usersRoutes, { prefix: '/api/v1/users' });
    // await app.register(ordersRoutes, { prefix: '/api/v1/orders' });
    // await app.register(driversRoutes, { prefix: '/api/v1/drivers' });
    
    // ============ ERROR HANDLERS ============
    
    // 404 handler
    app.setNotFoundHandler(notFoundHandler);
    
    // Global error handler
    app.setErrorHandler(errorHandler);
    
    return app;
};

export default buildApp;
