// services/backend/src/modules/auth/auth.routes.js
import authController from './auth.controller.js';
import { refreshTokenSchema, verifyFirebaseSchema } from './auth.schema.js';

async function authRoutes(fastify, options) {
    // POST /api/v1/auth/firebase/verify
    fastify.post(
        '/firebase/verify',
        {
            schema: verifyFirebaseSchema,
        },
        authController.verifyFirebase.bind(authController)
    );
    
    // POST /api/v1/auth/refresh
    fastify.post(
        '/refresh',
        {
            schema: refreshTokenSchema,
        },
        authController.refreshToken.bind(authController)
    );
    
    // POST /api/v1/auth/logout
    fastify.post(
        '/logout',
        {
            onRequest: [fastify.authenticate], // Requires authentication
        },
        authController.logout.bind(authController)
    );
}

export default authRoutes;

