import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const migrationPath = path.join(process.cwd(), 'migrations', '1713600000000_add_multiple_documents.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log("Running migration...");
    await pool.query(sql);
    console.log("Migration completed successfully.");
    
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
