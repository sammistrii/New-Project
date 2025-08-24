import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Get user profile and wallet
 * GET /api/users/me
 */
router.get('/me', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // For now, return mock data
  // In the full version, this would query the database
  res.json({
    user: req.user,
    wallet: {
      user_id: userId,
      points_balance: 0,
      cash_balance: 0.00,
      locked_amount: 0.00,
      total_points_earned: 0,
      total_cash_earned: 0.00,
    },
  });
}));

/**
 * Update user profile
 * PUT /api/users/me
 */
router.put('/me', asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, phone } = req.body;

  // For now, just return success
  // In the full version, this would update the database
  res.json({
    message: 'Profile updated successfully',
    user: {
      ...req.user,
      name: name || req.user.name,
      phone: phone || req.user.phone,
    },
  });
}));

/**
 * Get user wallet
 * GET /api/users/wallet
 */
router.get('/wallet', asyncHandler(async (req, res) => {
  const userId = req.userId;

  // For now, return mock data
  res.json({
    wallet: {
      user_id: userId,
      points_balance: 0,
      cash_balance: 0.00,
      locked_amount: 0.00,
      total_points_earned: 0,
      total_cash_earned: 0.00,
    },
  });
}));

export default router;