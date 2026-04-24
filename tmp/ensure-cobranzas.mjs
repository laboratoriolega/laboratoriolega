import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

async function check() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrl = env.match(/DATABASE_URL=(.+)/)[1].trim();

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    try {
        console.log('--- Database Audit ---');
        const info = await pool.query("SELECT current_database(), current_schema(), current_user");
        console.log('Context:', info.rows[0]);

        console.log('Creating table cobranzas...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cobranzas (
                id SERIAL PRIMARY KEY,
                fecha DATE NOT NULL,
                paciente TEXT NOT NULL,
                dni TEXT,
                factura TEXT,
                observacion TEXT,
                seguimiento TEXT NOT NULL DEFAULT 'Pendiente',
                month_group TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const verify = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'cobranzas'");
        console.log('Verification:', verify.rows);

        if (verify.rows.length === 0) {
            console.error('CRITICAL: Table was NOT created even after success message.');
        } else {
            console.log('SUCCESS: Table cobranzas is live.');
        }

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

check();
