import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../database/connection.js';
import { 
  generateToken, 
  generateRefreshToken, 
  hashPassword, 
  comparePassword 
} from '../middleware/auth.js';
import { logUserAction, logSecurityEvent } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * User registration
 * POST /api/auth/register
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const { email, password, name, phone } = req.body;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'User with this email already exists',
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user and wallet in transaction
  const result = await transaction(async (client) => {
    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, name, phone, password_hash, role, email_verified) 
       VALUES ($1, $2, $3, $4, 'tourist', false) 
       RETURNING id, email, name, role, created_at`,
      [email, name, phone, hashedPassword]
    );

    const user = userResult.rows[0];

    // Create wallet
    await client.query(
      'INSERT INTO user_wallets (user_id) VALUES ($1)',
      [user.id]
    );

    return user;
  });

  // Generate tokens
  const accessToken = generateToken({ userId: result.id });
  const refreshToken = generateRefreshToken({ userId: result.id });

  // Store refresh token
  await query(
    'INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3)',
    [result.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
  );

  // Log user registration
  logUserAction(result.id, 'user_registered', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  });
}));

/**
 * User login
 * POST /api/auth/login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user with password hash
  const userResult = await query(
    'SELECT id, email, name, role, password_hash, is_active FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    logSecurityEvent('login_failed_user_not_found', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
  }

  const user = userResult.rows[0];

  // Check if user is active
  if (!user.is_active) {
    logSecurityEvent('login_failed_inactive_user', {
      userId: user.id,
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Account is deactivated',
    });
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    logSecurityEvent('login_failed_invalid_password', {
      userId: user.id,
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
  }

  // Update last login
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const accessToken = generateToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Store refresh token
  await query(
    'INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
    [
      user.id, 
      refreshToken, 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      req.ip,
      req.get('User-Agent')
    ]
  );

  // Log successful login
  logUserAction(user.id, 'user_login', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  });
}));

/**
 * Refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', [
  body('refreshToken').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const { refreshToken } = req.body;

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token exists and is valid
    const sessionResult = await query(
      'SELECT user_id, expires_at FROM user_sessions WHERE refresh_token_hash = $1 AND expires_at > NOW()',
      [refreshToken]
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
  } catch (error) {
    logSecurityEvent('refresh_token_failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    });
  }
}));

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Invalidate refresh token
    await query(
      'DELETE FROM user_sessions WHERE refresh_token_hash = $1',
      [refreshToken]
    );
  }

  res.json({
    message: 'Logout successful',
  });
}));

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const { email } = req.body;

  // Check if user exists
  const userResult = await query(
    'SELECT id, name FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (userResult.rows.length === 0) {
    // Don't reveal if user exists or not
    return res.json({
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  }

  const user = userResult.rows[0];

  // Generate reset token (in production, use crypto.randomBytes)
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetToken, resetTokenExpiry, user.id]
  );

  // TODO: Send email with reset link
  // For now, just log it
  logUserAction(user.id, 'password_reset_requested', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    resetToken, // In production, don't log this
  });

  res.json({
    message: 'If an account with that email exists, a password reset link has been sent',
  });
}));

/**
 * Reset password
 * POST /api/auth/reset-password
 */
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const { token, password } = req.body;

  // Find user with valid reset token
  const userResult = await query(
    'SELECT id, email, name FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );

  if (userResult.rows.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid or expired reset token',
    });
  }

  const user = userResult.rows[0];

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update password and clear reset token
  await query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [hashedPassword, user.id]
  );

  // Invalidate all existing sessions
  await query(
    'DELETE FROM user_sessions WHERE user_id = $1',
    [user.id]
  );

  // Log password reset
  logUserAction(user.id, 'password_reset_completed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.json({
    message: 'Password reset successful',
  });
}));

/**
 * Social authentication callback
 * GET /api/auth/:provider/callback
 */
router.get('/:provider/callback', asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Authorization code required',
    });
  }

  // TODO: Implement social authentication providers
  // This is a placeholder for OAuth flow
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Social authentication not yet implemented',
  });
}));

/**
 * Verify email
 * GET /api/auth/verify-email/:token
 */
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find user with verification token
  const userResult = await query(
    'SELECT id, email, name FROM users WHERE verification_token = $1 AND email_verified = false',
    [token]
  );

  if (userResult.rows.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid or expired verification token',
    });
  }

  const user = userResult.rows[0];

  // Mark email as verified
  await query(
    'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1',
    [user.id]
  );

  // Log email verification
  logUserAction(user.id, 'email_verified', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.json({
    message: 'Email verified successfully',
  });
}));

export default router;