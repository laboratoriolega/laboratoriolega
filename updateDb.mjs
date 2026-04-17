import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS document_base64 TEXT;');
    console.log("Column document_base64 added successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
