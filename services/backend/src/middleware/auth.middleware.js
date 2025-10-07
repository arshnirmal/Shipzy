// services/backend/src/middleware/auth.middleware.js
import crypto from 'crypto';
import logger from '../config/logger.js';
import authRepository from '../modules/auth/auth.repository.js';
import { AuthenticationError, AuthorizationError } from '../utils/error.util.js';
import { verifyToken } from '../utils/jwt.util.js';

/**
 * JWT authentication middleware
 */
export const authenticate = async (request, reply) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = request.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }
        
        const token = authHeader.substring(7);
        
        // 2. Verify token
        const decoded = verifyToken(token);
        
        // 3. Hash token for database lookup
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // 4. Validate token in database (check if revoked)
        const session = await authRepository.validateJwtToken(tokenHash);
        
        if (!session) {
            throw new AuthenticationError('Invalid or revoked token');
        }
        
        // 5. Update last activity (async, non-blocking)
        authRepository.updateSessionActivity(tokenHash).catch(err => {
            logger.warn('Failed to update session activity', { error: err.message });
        });
        
        // 6. Attach user info to request
        request.user = {
            userId: decoded.userId,
            userUuid: decoded.userUuid,
            role: decoded.role,
            phoneNumber: decoded.phoneNumber,
        };
        
    } catch (error) {
        logger.error('Authentication failed', { error: error.message });
        throw new AuthenticationError(error.message || 'Authentication failed');
    }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles) => {
    return async (request, reply) => {
        if (!request.user) {
            throw new AuthenticationError('Not authenticated');
        }
        
        if (!allowedRoles.includes(request.user.role)) {
            throw new AuthorizationError('Insufficient permissions');
        }
    };
};

