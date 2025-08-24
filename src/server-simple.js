import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    message: 'Eco-Points System running in simplified mode (no database)',
  });
});

// Mock data for testing without database
const mockUsers = new Map();
const mockSubmissions = new Map();
const mockWallets = new Map();

// Initialize default mock user
const defaultUserId = 'mock-user-1';
mockUsers.set(defaultUserId, { 
  id: defaultUserId, 
  email: 'test@example.com', 
  name: 'Test User', 
  role: 'tourist' 
});
mockWallets.set(defaultUserId, { 
  userId: defaultUserId, 
  points_balance: 0, 
  cash_balance: 0.00 
});

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required',
    });
  }

  const token = authHeader.substring(7);
  
  // Simple token validation (in production, use JWT)
  if (token === 'mock-token-123') {
    req.user = mockUsers.get(defaultUserId);
    req.userId = defaultUserId;
    next();
  } else {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
};

// Mock endpoints for testing
app.post('/api/mock/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email, password, and name are required',
    });
  }

  const userId = `user-${Date.now()}`;
  mockUsers.set(userId, { id: userId, email, name, role: 'tourist' });
  mockWallets.set(userId, { userId, points_balance: 0, cash_balance: 0.00 });

  res.status(201).json({
    message: 'User registered successfully (mock)',
    user: { id: userId, email, name, role: 'tourist' },
    tokens: {
      accessToken: 'mock-token-123',
      refreshToken: 'mock-refresh-123',
      expiresIn: '15m',
    },
  });
});

app.post('/api/mock/submission', mockAuthMiddleware, (req, res) => {
  const { s3_key, gps_lat, gps_lng, recorded_at, duration_s } = req.body;
  
  if (!s3_key || !gps_lat || !gps_lng || !recorded_at) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required fields',
    });
  }

  const submissionId = `submission-${Date.now()}`;
  const submission = {
    id: submissionId,
    user_id: req.userId,
    s3_key,
    gps_lat,
    gps_lng,
    recorded_at,
    duration_s: duration_s || 15,
    status: 'auto_verified',
    auto_score: 85,
    created_at: new Date().toISOString(),
  };

  mockSubmissions.set(submissionId, submission);

  // Credit points for auto-verified submission
  const wallet = mockWallets.get(req.userId);
  if (wallet) {
    wallet.points_balance += 100;
  }

  res.status(201).json({
    message: 'Video submission created successfully (mock)',
    submission: {
      id: submissionId,
      status: submission.status,
      auto_score: submission.auto_score,
      created_at: submission.created_at,
    },
  });
});

app.get('/api/mock/submissions', mockAuthMiddleware, (req, res) => {
  const userSubmissions = Array.from(mockSubmissions.values())
    .filter(sub => sub.user_id === req.userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    submissions: userSubmissions,
    pagination: {
      page: 1,
      limit: 20,
      total: userSubmissions.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  });
});

app.get('/api/mock/profile', mockAuthMiddleware, (req, res) => {
  const user = mockUsers.get(req.userId);
  const wallet = mockWallets.get(req.userId);

  if (!user || !wallet) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'User or wallet not found',
    });
  }

  res.json({
    user,
    wallet,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Eco-Points System (simplified) running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n📋 Mock endpoints available:`);
  console.log(`   POST /api/mock/register - Register user`);
  console.log(`   POST /api/mock/submission - Create submission`);
  console.log(`   GET /api/mock/submissions - List submissions`);
  console.log(`   GET /api/mock/profile - Get user profile`);
  console.log(`\n🔑 Use token: mock-token-123 for authenticated requests`);
  console.log(`\n👤 Default mock user: mock-user-1`);
});

export default app;