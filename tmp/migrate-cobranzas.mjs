import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

async function migrate() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrl = env.match(/DATABASE_URL=(.+)/)[1].trim();

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
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
            );
            CREATE INDEX IF NOT EXISTS idx_cobranzas_month_group ON cobranzas(month_group);
        `);
        console.log('Migration successful: table cobranzas ready.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
