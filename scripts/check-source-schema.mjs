import pg from 'pg';
const { Client } = pg;

const SOURCE_URL = 'postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function checkSchema() {
  const source = new Client({ connectionString: SOURCE_URL });

  try {
    await source.connect();
    const res = await source.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema='public'
      ORDER BY table_name, ordinal_position
    `);
    
    const schema = {};
    res.rows.forEach(row => {
      if (!schema[row.table_name]) schema[row.table_name] = [];
      schema[row.table_name].push(row.column_name);
    });

    console.log(JSON.stringify(schema, null, 2));

  } catch (error) {
    console.error("Check failed:", error);
  } finally {
    await source.end();
  }
}

checkSchema();
