import pg from 'pg';
const { Client } = pg;

const DB_URL = "postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function diagnostic() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    const res = await client.query("SELECT id, document_url FROM appointment_documents WHERE document_url LIKE '%8msikhgphbcx6ijs%'");
    console.log(`Found ${res.rows.length} records with old URLs:`);
    console.log(JSON.stringify(res.rows, null, 2));

    const res2 = await client.query("SELECT id, document_url FROM appointments WHERE document_url LIKE '%8msikhgphbcx6ijs%'");
    console.log(`\nFound ${res2.rows.length} records in appointments with old URLs:`);
    console.log(JSON.stringify(res2.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

diagnostic();
