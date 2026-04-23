import pg from 'pg';
const { Client } = pg;

const DB_URL = "postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function createTable() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    console.log("Connected to database.");

    console.log("Creating table prestaciones_data...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS prestaciones_data (
        id SERIAL PRIMARY KEY,
        sheet_name VARCHAR(255) NOT NULL,
        row_data JSONB NOT NULL,
        row_index INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create index on sheet_name for faster tab loading
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sheet_name ON prestaciones_data (sheet_name);`);

    console.log("Table and index created successfully.");
  } catch (error) {
    console.error("Failed to create table:", error);
  } finally {
    await client.end();
  }
}

createTable();
