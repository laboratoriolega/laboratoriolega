const { Pool } = require('pg');
const fs = require('fs');

async function migrate() {
    const envPath = 'c:/Users/Nicolas France/LEGA/.env.local';
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let dbUrl = '';
    lines.forEach(line => {
        if (line.trim().startsWith('DATABASE_URL=')) {
            dbUrl = line.split('=')[1].trim().replace(/^"|"$/g, '');
        }
    });

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    
    try {
        console.log('Adding aire_test_type column...');
        await pool.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS aire_test_type TEXT;`);
        console.log('✅ Column added successfully');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
