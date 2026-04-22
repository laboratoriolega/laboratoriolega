import pkg from 'pg';
import fs from 'fs';
import path from 'path';
const { Pool } = pkg;

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DATABASE_URL=')).split('=')[1].trim();

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log("Updating appointments table with address columns...");
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS domicilio_address TEXT");
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_maps_link TEXT");
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
