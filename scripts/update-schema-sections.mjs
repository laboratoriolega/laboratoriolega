import pg from 'pg';
const { Client } = pg;

const DB_URL = "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function updateSchema() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    console.log("Connected to database.");

    console.log("Creating table prestaciones_sections...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS prestaciones_sections (
        id SERIAL PRIMARY KEY,
        sheet_name VARCHAR(255) NOT NULL,
        title TEXT,
        subtitle TEXT,
        note TEXT,
        headers JSONB,
        row_index INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log("Adding section_id to prestaciones_data...");
    // Check if column exists first
    const checkCol = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='prestaciones_data' AND column_name='section_id'");
    if (checkCol.rows.length === 0) {
      await client.query(`ALTER TABLE prestaciones_data ADD COLUMN section_id INTEGER REFERENCES prestaciones_sections(id);`);
    }

    console.log("Schema updated successfully.");
  } catch (error) {
    console.error("Failed to update schema:", error);
  } finally {
    await client.end();
  }
}

updateSchema();
