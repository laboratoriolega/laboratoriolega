const { Pool } = require('pg');
const fs = require('fs');

async function fixTimezone() {
    const envPath = 'c:/Users/Nicolas France/LEGA/.env.local';
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let dbUrl = '';
    lines.forEach(line => {
        if (line.includes('DATABASE_URL')) dbUrl = line.split('=')[1].split('=')[0].trim(); // Rough parse
        // Actually let's just use substring
        if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
    });

    if (!dbUrl) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    
    try {
        console.log('Migrating appointments table...');
        await pool.query("ALTER TABLE appointments ALTER COLUMN appointment_date TYPE TIMESTAMP WITH TIME ZONE USING appointment_date AT TIME ZONE 'UTC';");
        console.log('✅ Migration successful: appointment_date is now TIMESTAMPTZ.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixTimezone();
