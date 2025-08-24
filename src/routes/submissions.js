import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { query as dbQuery, transaction } from '../database/connection.js';
import { logSubmissionEvent, logUserAction } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireModerator } from '../middleware/auth.js';

const router = express.Router();

/**
 * Create video submission
 * POST /api/submissions
 */
router.post('/', [
  body('s3_key').notEmpty().isString(),
  body('gps_lat').isFloat({ min: -90, max: 90 }),
  body('gps_lng').isFloat({ min: -180, max: 180 }),
  body('recorded_at').isISO8601(),
  body('device_hash').optional().isString(),
  body('duration_s').optional().isInt({ min: 1 }),
  body('size_bytes').optional().isInt({ min: 1 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const {
    s3_key,
    gps_lat,
    gps_lng,
    recorded_at,
    device_hash,
    duration_s,
    size_bytes,
  } = req.body;

  const userId = req.userId;

  // Check rate limits
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const submissionCount = await dbQuery(
    'SELECT COUNT(*) FROM video_submissions WHERE user_id = $1 AND created_at >= $2',
    [userId, today]
  );

  const maxSubmissions = parseInt(process.env.MAX_SUBMISSIONS_PER_DAY) || 10;
  if (submissionCount.rows[0].count >= maxSubmissions) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: `Maximum ${maxSubmissions} submissions per day reached`,
    });
  }

  // Validate GPS coordinates against bin locations
  const binLocation = await dbQuery(
    `SELECT id, name, radius_m 
     FROM bin_locations 
     WHERE active = true 
     AND ST_DWithin(
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       ST_SetSRID(ST_MakePoint(lng, lat), 4326),
       radius_m
     )
     LIMIT 1`,
    [gps_lng, gps_lat]
  );

  if (binLocation.rows.length === 0) {
    return res.status(400).json({
      error: 'Invalid Location',
      message: 'GPS coordinates must be within range of a known bin location',
    });
  }

  // Validate timestamp
  const recordedDate = new Date(recorded_at);
  const now = new Date();
  const maxAgeHours = 24; // Allow submissions from last 24 hours
  
  if (recordedDate > now || recordedDate < new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000)) {
    return res.status(400).json({
      error: 'Invalid Timestamp',
      message: 'Recorded timestamp must be within the last 24 hours',
    });
  }

  // Calculate auto-score based on various factors
  let autoScore = 0;
  
  // GPS accuracy (if provided)
  if (req.body.gps_accuracy_m) {
    const accuracy = parseInt(req.body.gps_accuracy_m);
    if (accuracy <= 10) autoScore += 30;
    else if (accuracy <= 50) autoScore += 20;
    else if (accuracy <= 100) autoScore += 10;
  }

  // Video duration
  if (duration_s) {
    if (duration_s >= 30) autoScore += 25;
    else if (duration_s >= 15) autoScore += 15;
    else if (duration_s >= 10) autoScore += 10;
  }

  // Device hash (for duplicate detection)
  if (device_hash) {
    const recentSubmissions = await dbQuery(
      'SELECT COUNT(*) FROM video_submissions WHERE user_id = $1 AND device_hash = $2 AND created_at >= $3',
      [userId, device_hash, new Date(now.getTime() - 24 * 60 * 60 * 1000)]
    );
    
    if (recentSubmissions.rows[0].count > 0) {
      autoScore -= 20; // Penalty for multiple submissions from same device
    }
  }

  // Determine status based on auto-score
  const autoApproveThreshold = parseInt(process.env.AUTO_APPROVE_THRESHOLD) || 80;
  const autoRejectThreshold = parseInt(process.env.AUTO_REJECT_THRESHOLD) || 30;
  
  let status = 'needs_review';
  if (autoScore >= autoApproveThreshold) {
    status = 'auto_verified';
  } else if (autoScore < autoRejectThreshold) {
    status = 'rejected';
  }

  // Create submission in transaction
  const result = await transaction(async (client) => {
    const submissionResult = await client.query(
      `INSERT INTO video_submissions (
        user_id, s3_key, gps_lat, gps_lng, recorded_at, device_hash, 
        duration_s, size_bytes, bin_id_guess, auto_score, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, status, auto_score, created_at`,
      [
        userId, s3_key, gps_lat, gps_lng, recorded_at, device_hash,
        duration_s, size_bytes, binLocation.rows[0].id, autoScore, status
      ]
    );

    const submission = submissionResult.rows[0];

    // Log submission event
    await client.query(
      `INSERT INTO submission_events (
        submission_id, actor_id, event_type, meta, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        submission.id,
        userId,
        'submission_created',
        JSON.stringify({ auto_score: autoScore, bin_location: binLocation.rows[0].name }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    // If auto-approved, credit points immediately
    if (status === 'auto_verified') {
      const pointsToCredit = parseInt(process.env.POINTS_PER_APPROVED_SUBMISSION) || 100;
      
      await client.query(
        'UPDATE user_wallets SET points_balance = points_balance + $1, total_points_earned = total_points_earned + $1 WHERE user_id = $2',
        [pointsToCredit, userId]
      );

      await client.query(
        `INSERT INTO submission_events (
          submission_id, actor_id, event_type, meta
        ) VALUES ($1, $2, $3, $4)`,
        [submission.id, userId, 'points_credited', JSON.stringify({ points: pointsToCredit })]
      );
    }

    return submission;
  });

  // Log submission creation
  logSubmissionEvent(result.id, 'submission_created', {
    userId,
    status: result.status,
    autoScore: result.auto_score,
    binLocation: binLocation.rows[0].name,
    ip: req.ip,
  });

  res.status(201).json({
    message: 'Video submission created successfully',
    submission: {
      id: result.id,
      status: result.status,
      auto_score: result.auto_score,
      created_at: result.created_at,
    },
  });
}));

/**
 * Get user's submissions
 * GET /api/submissions
 */
router.get('/', [
  query('status').optional().isIn(['queued', 'auto_verified', 'needs_review', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
  }

  const { status, page = 1, limit = 20 } = req.query;
  const userId = req.userId;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE user_id = $1';
  let params = [userId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Get submissions
  const submissionsResult = await dbQuery(
    `SELECT 
       id, s3_key, thumb_key, duration_s, size_bytes, gps_lat, gps_lng,
       recorded_at, auto_score, status, rejection_reason, created_at
     FROM video_submissions 
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await dbQuery(
    `SELECT COUNT(*) FROM video_submissions ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  res.json({
    submissions: submissionsResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}));

/**
 * Get submission by ID
 * GET /api/submissions/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const submissionResult = await dbQuery(
    `SELECT 
       id, s3_key, thumb_key, duration_s, size_bytes, gps_lat, gps_lng,
       recorded_at, auto_score, status, rejection_reason, created_at,
       bin_id_guess
     FROM video_submissions 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (submissionResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Submission not found',
    });
  }

  const submission = submissionResult.rows[0];

  // Get bin location info if available
  if (submission.bin_id_guess) {
    const binResult = await dbQuery(
      'SELECT name, description FROM bin_locations WHERE id = $1',
      [submission.bin_id_guess]
    );
    if (binResult.rows.length > 0) {
      submission.bin_location = binResult.rows[0];
    }
  }

  // Get submission events
  const eventsResult = await dbQuery(
    `SELECT event_type, meta, created_at 
     FROM submission_events 
     WHERE submission_id = $1 
     ORDER BY created_at ASC`,
    [id]
  );

  submission.events = eventsResult.rows;

  res.json({
    submission,
  });
}));

/**
 * Get submission status
 * GET /api/submissions/:id/status
 */
router.get('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const statusResult = await dbQuery(
    'SELECT status, auto_score, rejection_reason, updated_at FROM video_submissions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (statusResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Submission not found',
    });
  }

  res.json({
    status: statusResult.rows[0],
  });
}));

/**
 * Delete submission (only if not yet processed)
 * DELETE /api/submissions/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // Check if submission can be deleted
  const submissionResult = await dbQuery(
    'SELECT status FROM video_submissions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (submissionResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Submission not found',
    });
  }

  const submission = submissionResult.rows[0];

  if (submission.status !== 'queued' && submission.status !== 'needs_review') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Cannot delete submission that has been processed',
    });
  }

  // Delete submission and related events
  await transaction(async (client) => {
    await client.query('DELETE FROM submission_events WHERE submission_id = $1', [id]);
    await client.query('DELETE FROM video_submissions WHERE id = $1', [id]);
  });

  // Log deletion
  logSubmissionEvent(id, 'submission_deleted', {
    userId,
    previousStatus: submission.status,
    ip: req.ip,
  });

  res.json({
    message: 'Submission deleted successfully',
  });
}));

export default router;