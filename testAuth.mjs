import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    if (res.rows.length === 0) {
      console.log("No existe el admin!");
      return;
    }
    const user = res.rows[0];
    console.log("User:", user.username, "Hash:", user.password_hash);
    const match = await bcrypt.compare("admin123", user.password_hash);
    console.log("Match:", match);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
