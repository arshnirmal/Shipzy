// services/backend/src/utils/jwt.util.js
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        logger.error('JWT verification failed', { error: error.message });
        throw error;
    }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
export const decodeToken = (token) => {
    return jwt.decode(token);
};

/**
 * Generate token hash for storage
 * @param {string} token - JWT token
 * @returns {string} SHA256 hash
 */
export const hashToken = async (token) => {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
};

