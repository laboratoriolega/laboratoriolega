const { Pool } = require('pg');
const fs = require('fs');

async function checkPatients() {
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
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'patients'
        `);
        console.log('Patients Schema:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkPatients();
