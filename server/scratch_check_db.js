const knex = require('knex');
const config = require('./knexfile');

async function check() {
  const db = knex(config.development);
  try {
    const hasTable = await db.schema.hasTable('sale_payments');
    console.log('Table sale_payments exists:', hasTable);
    if (hasTable) {
      const columns = await db('sale_payments').columnInfo();
      console.log('Columns:', Object.keys(columns));
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await db.destroy();
  }
}

check();
