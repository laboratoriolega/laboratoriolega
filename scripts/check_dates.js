const { Pool } = require('pg');
const fs = require('fs');

async function checkDates() {
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
            SELECT id, appointment_date 
            FROM appointments 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log('Recent Appointments:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDates();
