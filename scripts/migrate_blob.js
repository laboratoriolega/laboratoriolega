const { Pool } = require('pg');
const fs = require('fs');

async function migrate() {
    const envPath = 'c:/Users/Nicolas France/LEGA/.env.local';
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let dbUrl = '';
    lines.forEach(line => {
        if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
    });

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    
    try {
        console.log('Adding document_url column...');
        await pool.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS document_url TEXT;`);
        console.log('✅ Added document_url column');
        
        // We keep document_base64 for backward compat but stop using it for new uploads
        console.log('Migration complete. Old document_base64 column kept for existing records.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
