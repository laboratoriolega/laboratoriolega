const { Pool } = require('pg');
const fs = require('fs');

async function debugData() {
    const envPath = 'c:/Users/Nicolas France/LEGA/.env.local';
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let dbUrl = '';
    lines.forEach(line => {
        if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
    });

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    
    try {
        const res = await pool.query(`
            SELECT a.id, a.appointment_date, a.status, a.analysis_type, p.name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            ORDER BY a.created_at DESC 
            LIMIT 5
        `);
        console.log('Recent Data:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debugData();
