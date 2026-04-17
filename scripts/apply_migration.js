const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic env parser for .env.local
function loadEnv() {
    const envPath = 'c:/Users/Nicolas France/LEGA/.env.local';
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('Environment loaded from .env.local');
    } catch (err) {
        console.error('Could not load .env.local:', err.message);
    }
}

async function runMigration() {
    loadEnv();
    
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const migrationSql = fs.readFileSync('c:/Users/Nicolas France/LEGA/scripts/migrate_audit.sql', 'utf8');
        console.log('Running migration...');
        await pool.query(migrationSql);
        console.log('✅ Migration successful: audit_logs table and full_name column created.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
