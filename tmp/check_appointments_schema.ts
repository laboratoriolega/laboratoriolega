import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments'
    `);
    console.log("Columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`));

    const sample = await pool.query(`SELECT document_url, document_base64 FROM appointments WHERE document_url IS NOT NULL OR document_base64 IS NOT NULL LIMIT 2`);
    console.log("Sample documents:", sample.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
