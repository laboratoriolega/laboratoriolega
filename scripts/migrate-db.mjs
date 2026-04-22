import pg from 'pg';
const { Client } = pg;

const SOURCE_URL = 'postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const TARGET_URL = 'postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  const source = new Client({ connectionString: SOURCE_URL });
  const target = new Client({ connectionString: TARGET_URL });

  try {
    await source.connect();
    await target.connect();
    console.log("Connected to both databases.");

    const tables = [
      'users', 
      'patients', 
      'appointments', 
      'appointment_documents', 
      'audit_logs',
      'billing_prices',
      'pendientes',
      'system_codes'
    ];

    for (const table of tables) {
      console.log(`\n>>> Migrating table: ${table}...`);
      
      const res = await source.query(`SELECT * FROM ${table}`);
      console.log(`Found ${res.rows.length} rows in ${table}.`);

      if (res.rows.length === 0) {
        console.log(`Skipping empty table: ${table}`);
        continue;
      }

      const columns = Object.keys(res.rows[0]);
      console.log(`Table columns: ${columns.join(', ')}`);
      
      const colStr = columns.join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      await target.query('BEGIN');
      try {
        await target.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`Truncated target table: ${table}`);
        
        for (let i = 0; i < res.rows.length; i++) {
          const row = res.rows[i];
          const values = columns.map(col => row[col]);
          
          try {
            const query = `INSERT INTO ${table} (${colStr}) VALUES (${placeholders})`;
            await target.query(query, values);
          } catch (insertErr) {
            console.error(`INSERT FAILED at row ${i} of ${table}`);
            console.error(`Row data keys: ${Object.keys(row).join(', ')}`);
            console.error(`Values length: ${values.length}`);
            throw insertErr;
          }
        }
        await target.query('COMMIT');
        console.log(`Successfully migrated ${table}.`);
        
        const serialTables = ['users', 'audit_logs', 'appointment_documents', 'billing_prices', 'pendientes', 'system_codes'];
        if (serialTables.includes(table)) {
            await target.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}))`);
            console.log(`Reset sequence for ${table}`);
        }

      } catch (err) {
        await target.query('ROLLBACK');
        console.error(`Error migrating table ${table}:`, err.message);
        throw err;
      }
    }

    console.log("\nMigration completed successfully!");

  } catch (error) {
    console.error("\nMigration failed!");
  } finally {
    await source.end();
    await target.end();
  }
}

migrate();
