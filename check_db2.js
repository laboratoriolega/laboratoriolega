const { Pool } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const DATABASE_URL = env.match(/DATABASE_URL=(.*)/)[1].trim();
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const res = await pool.query("SELECT row_index, row_data->>'__EMPTY' as val, row_data->>'meta_part' as part FROM prestaciones_data WHERE sheet_name = 'Federacion-PAMI' AND row_data->>'meta_part' = 'MONTH_TITLE'");
  console.log(res.rows);
  pool.end();
}
run();
