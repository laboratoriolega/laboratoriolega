import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed admin
    const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', ['admin', hash, 'admin']);
      console.log('Admin user created (admin / admin123)');
    } else {
      console.log('Admin user already exists');
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
