import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const defaultColumns = [
  { key: "analisis", label: "Análisis" },
  { key: "derivacion", label: "Derivación" },
  { key: "muestra", label: "Muestra" },
  { key: "guia", label: "Guía" },
  { key: "indicaciones", label: "Indicaciones" },
  { key: "demora", label: "Demora" },
  { key: "observaciones", label: "Observaciones" }
];

async function main() {
  await client.connect();
  try {
    // 1. Create config table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analisis_lista_config (
        id SERIAL PRIMARY KEY,
        config JSONB NOT NULL
      )
    `);

    // 2. Insert default config if empty
    const checkRes = await client.query('SELECT id FROM analisis_lista_config LIMIT 1');
    if (checkRes.rows.length === 0) {
      await client.query('INSERT INTO analisis_lista_config (config) VALUES ($1)', [
        JSON.stringify({ columns: defaultColumns })
      ]);
      console.log('Inserted default config');
    }

    // 3. Add data JSONB column to analisis_lista
    await client.query('ALTER TABLE analisis_lista ADD COLUMN IF NOT EXISTS data JSONB');

    // 4. Migrate existing data
    const existingDataRes = await client.query('SELECT * FROM analisis_lista WHERE data IS NULL');
    console.log(`Migrating ${existingDataRes.rows.length} rows...`);
    
    for (const row of existingDataRes.rows) {
      const dataObj = {
        analisis: row.analisis || "",
        derivacion: row.derivacion || "",
        muestra: row.muestra || "",
        guia: row.guia || "",
        indicaciones: row.indicaciones || "",
        demora: row.demora || "",
        observaciones: row.observaciones || ""
      };
      
      await client.query('UPDATE analisis_lista SET data = $1 WHERE id = $2', [JSON.stringify(dataObj), row.id]);
    }
    
    console.log('Migration completed');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
main();
