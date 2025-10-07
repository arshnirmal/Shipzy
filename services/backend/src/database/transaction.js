// services/backend/src/database/transaction.js
import logger from '../config/logger.js';
import db from './db.js';

/**
 * Execute a function within a database transaction
 * @param {Function} callback - Async function that receives a client
 * @returns {Promise<*>} Result of the callback
 */
export const transaction = async (callback) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        logger.debug('Transaction started');
        
        const result = await callback(client);
        
        await client.query('COMMIT');
        logger.debug('Transaction committed');
        
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.warn('Transaction rolled back', { error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

export default { transaction };
