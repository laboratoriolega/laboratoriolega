import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);');
    console.log("Column phone added successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
