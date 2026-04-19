import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'appointment_date'
    `);
    console.log("Column Type:", res.rows[0]);

    const data = await pool.query(`
      SELECT appointment_date, appointment_date AT TIME ZONE 'UTC' as utc_val
      FROM appointments 
      LIMIT 1
    `);
    console.log("Sample Data:", data.rows[0]);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
