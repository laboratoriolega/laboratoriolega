import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Creating notas_ws table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notas_ws (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT,
        color VARCHAR(50) DEFAULT '#fef68a',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating analisis_lista table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analisis_lista (
        id SERIAL PRIMARY KEY,
        analisis TEXT NOT NULL,
        derivacion TEXT,
        muestra TEXT,
        guia TEXT,
        indicaciones TEXT,
        demora TEXT,
        observaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', e);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
