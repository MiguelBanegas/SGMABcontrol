const knex = require('knex');
const config = require('./knexfile');

async function run() {
  const db = knex(config.development);
  try {
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await db.destroy();
  }
}

run();
