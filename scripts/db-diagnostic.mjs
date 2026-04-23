import pg from 'pg';
const { Client } = pg;

const DB_URL = "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function diagnostic() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    const res = await client.query("SELECT id, document_url FROM appointment_documents WHERE document_url LIKE '%8msikhgphbcx6ijs%'");
    console.log(`Found ${res.rows.length} records with old URLs in appointment_documents.`);
    if (res.rows.length > 0) console.log(JSON.stringify(res.rows, null, 2));

    const res2 = await client.query("SELECT id, document_url FROM appointments WHERE document_url LIKE '%8msikhgphbcx6ijs%'");
    console.log(`Found ${res2.rows.length} records with old URLs in appointments.`);
    if (res2.rows.length > 0) console.log(JSON.stringify(res2.rows, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

diagnostic();
