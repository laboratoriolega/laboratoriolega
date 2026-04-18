const { Pool } = require('pg');
const fs = require('fs');

async function checkSize() {
    const envPath = 'c:/Users/Nicolas France/LEGA/.env.local';
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let dbUrl = '';
    lines.forEach(line => {
        if (line.includes('DATABASE_URL')) dbUrl = line.split('=')[1].trim();
    });

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    
    try {
        const res = await pool.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size;
        `);
        console.log('Database Size:', res.rows[0].size);
        
        const tables = await pool.query(`
            SELECT relname AS "table", pg_size_pretty(pg_total_relation_size(relid)) AS "size"
            FROM pg_catalog.pg_statio_user_tables
            ORDER BY pg_total_relation_size(relid) DESC;
        `);
        console.log('Table Sizes:', tables.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSize();
