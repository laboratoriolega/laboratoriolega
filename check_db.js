const { Pool } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const DATABASE_URL = env.match(/DATABASE_URL=(.*)/)[1].trim();
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function check() {
  const sheets = ['Cotizador', 'Federacion-PAMI', 'Convenios Particulares', 'Delgado'];
  for (const s of sheets) {
    const r = await pool.query("SELECT COUNT(*), MIN(row_index), MAX(row_index) FROM prestaciones_data WHERE sheet_name=$1", [s]);
    console.log(s + ':', JSON.stringify(r.rows[0]));
  }
  await pool.end();
}
check().catch(console.error);
