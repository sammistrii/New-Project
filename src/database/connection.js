import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

let pool = null;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'eco_points_db',
  user: process.env.DB_USER || 'eco_points_user',
  password: process.env.DB_PASSWORD || 'your_secure_password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
};

/**
 * Initialize database connection pool
 */
export async function initializeDatabase() {
  try {
    if (pool) {
      logger.info('Database pool already initialized');
      return pool;
    }

    pool = new Pool(dbConfig);

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connection pool initialized successfully');
    
    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database pool instance
 */
export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query(text, params = []) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration,
      rows: res.rowCount,
    });
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query execution failed', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration,
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

/**
 * Execute a transaction with multiple queries
 */
export async function transaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

/**
 * Health check for database
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as timestamp, version() as version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version.split(' ')[1], // Extract version number
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Set current user context for RLS policies
 */
export async function setCurrentUser(userId) {
  if (!userId) return;
  
  try {
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_id',
      userId.toString()
    ]);
  } catch (error) {
    logger.warn('Failed to set current user context:', error);
  }
}

/**
 * Clear current user context
 */
export async function clearCurrentUser() {
  try {
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_id',
      ''
    ]);
  } catch (error) {
    logger.warn('Failed to clear current user context:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

export default {
  initializeDatabase,
  getPool,
  query,
  transaction,
  closeDatabase,
  healthCheck,
  setCurrentUser,
  clearCurrentUser,
};