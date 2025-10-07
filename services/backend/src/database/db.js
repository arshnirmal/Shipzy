// services/backend/src/database/db.js
import pg from 'pg';
import config from '../config/env.js';
import logger from '../config/logger.js';

const { Pool } = pg;

const pool = new Pool(config.database);

// Connection event handlers
pool.on('connect', (client) => {
    logger.debug('New database connection established');
});

pool.on('error', (err, client) => {
    logger.error('Unexpected database error on idle client', { error: err.message });
});

pool.on('remove', () => {
    logger.debug('Database connection removed from pool');
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (config.logging.logQueries) {
            logger.debug('Query executed', {
                query: text.substring(0, 100),
                duration: `${duration}ms`,
                rows: result.rowCount,
            });
        }
        
        return result;
    } catch (error) {
        logger.error('Database query error', {
            query: text.substring(0, 100),
            params,
            error: error.message,
        });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
    const client = await pool.connect();
    const originalRelease = client.release.bind(client);
    
    // Track if client has been released
    let isReleased = false;
    client.release = () => {
        if (isReleased) {
            logger.warn('Attempted to release already released client');
            return;
        }
        isReleased = true;
        originalRelease();
    };
    
    return client;
};

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
const closePool = async () => {
    await pool.end();
    logger.info('Database connection pool closed');
};

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        logger.error('Failed to connect to database', { error: err.message });
        process.exit(1);
    } else {
        logger.info('Database connection successful', { time: res.rows[0].now });
    }
});

export default {
    query,
    getClient,
    pool,
    closePool,
};
