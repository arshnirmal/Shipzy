// services/backend/src/utils/jwt.util.ts
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import logger from "../config/logger.js";

interface JWTPayload {
  userId: number;
  userUuid: string;
  role: string;
  email?: string;
  phoneNumber?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 * @param payload - Token payload
 * @returns JWT token
 */
export const generateAccessToken = (payload: Partial<JWTPayload>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

/**
 * Generate JWT refresh token
 * @param payload - Token payload
 * @returns JWT refresh token
 */
export const generateRefreshToken = (payload: Partial<JWTPayload>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Verify JWT token
 * @param token - JWT token
 * @returns Decoded token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    logger.error({
      msg: "JWT verification failed",
      error: (error as Error).message,
    });
    throw error;
  }
};

/**
 * Decode JWT token without verification
 * @param token - JWT token
 * @returns Decoded token
 */
export const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};

/**
 * Generate token hash for storage
 * @param token - JWT token
 * @returns SHA256 hash
 */
export const hashToken = async (token: string): Promise<string> => {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(token).digest("hex");
};
