import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

async function dump() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrl = env.match(/DATABASE_URL=(.+)/)[1].trim();
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    try {
        const res = await pool.query("SELECT id, row_data FROM prestaciones_data WHERE sheet_name = 'Convenios Particulares' ORDER BY id ASC");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

dump();
