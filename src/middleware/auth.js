import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, setCurrentUser, clearCurrentUser } from '../database/connection.js';
import { logSecurityEvent, logUserAction } from '../utils/logger.js';

/**
 * Generate JWT token
 */
export function generateToken(payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN 
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token, secret = process.env.JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Authentication middleware
 */
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyToken(token);
      
      // Check if user exists and is active
      const userResult = await query(
        'SELECT id, email, name, role, is_active, email_verified FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found or inactive',
        });
      }

      const user = userResult.rows[0];
      
      // Set user context for RLS policies
      await setCurrentUser(user.id);
      
      // Add user info to request
      req.user = user;
      req.userId = user.id;
      
      // Log successful authentication
      logUserAction(user.id, 'authentication_success', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      next();
    } catch (tokenError) {
      logSecurityEvent('invalid_token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: tokenError.message,
      });

      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logSecurityEvent('auth_middleware_error', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service error',
    });
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent('insufficient_permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Require moderator or council role
 */
export const requireModerator = requireRole(['moderator', 'council']);

/**
 * Require council role only
 */
export const requireCouncil = requireRole(['council']);

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      
      const userResult = await query(
        'SELECT id, email, name, role, is_active, email_verified FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        await setCurrentUser(user.id);
        req.user = user;
        req.userId = user.id;
      }
    } catch (tokenError) {
      // Token is invalid, but we continue without authentication
      logSecurityEvent('optional_auth_invalid_token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: tokenError.message,
      });
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}

/**
 * Refresh token middleware
 */
export async function refreshTokenMiddleware(req, res, next) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token required',
      });
    }

    try {
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Check if refresh token exists in database
      const sessionResult = await query(
        'SELECT user_id, expires_at FROM user_sessions WHERE refresh_token_hash = $1 AND expires_at > NOW()',
        [refreshToken] // In production, you'd hash the refresh token
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
      }

      const session = sessionResult.rows[0];
      
      // Generate new access token
      const newAccessToken = generateToken({ userId: session.user_id });
      
      // Log token refresh
      logUserAction(session.user_id, 'token_refresh', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
    } catch (tokenError) {
      logSecurityEvent('invalid_refresh_token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: tokenError.message,
      });

      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token',
      });
    }
  } catch (error) {
    logSecurityEvent('refresh_token_error', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh service error',
    });
  }
}

/**
 * Cleanup middleware to clear user context
 */
export function cleanupUserContext(req, res, next) {
  res.on('finish', async () => {
    try {
      await clearCurrentUser();
    } catch (error) {
      // Log error but don't fail the response
      console.error('Failed to clear user context:', error);
    }
  });
  
  next();
}

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  requireRole,
  requireModerator,
  requireCouncil,
  optionalAuthMiddleware,
  refreshTokenMiddleware,
  cleanupUserContext,
};