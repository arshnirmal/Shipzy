const db = require('./db');

async function withTransaction(transactionCallback) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await transactionCallback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Example usage:
// withTransaction(async (client) => {
//   const res1 = await client.query('INSERT ...');
//   const res2 = await client.query('UPDATE ...');
//   return { res1, res2 };
// });

module.exports = { withTransaction };
