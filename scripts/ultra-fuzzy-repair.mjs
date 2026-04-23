import { list } from '@vercel/blob';
import pg from 'pg';
const { Client } = pg;

const TARGET_BLOB_TOKEN = "vercel_blob_rw_LrunrUnV4TRAzFoK_dgzXiJaXD56myVT06tNZiSFN2RIXsU";
const TARGET_DB_URL = "postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function ultraRepair() {
  const client = new Client({ connectionString: TARGET_DB_URL });
  try {
    await client.connect();
    const { blobs } = await list({ token: TARGET_BLOB_TOKEN });
    
    for (const blob of blobs) {
      const filename = blob.pathname.split('/').pop();
      if (!filename || filename.length < 5) continue;

      // Normalize filename for SQL (replace spaces with %)
      const fuzzyName = `%${filename.replace(/ /g, '%')}%`;
      const encodedFuzzyName = `%${filename.replace(/ /g, '%20')}%`;

      const q1 = `
        UPDATE appointment_documents 
        SET document_url = $1 
        WHERE (document_url ILIKE $2 OR document_url ILIKE $3 OR replace(document_url, '%20', ' ') ILIKE $2)
        AND document_url NOT LIKE '%lrunrunv4trazfok%'
      `;
      const res1 = await client.query(q1, [blob.url, fuzzyName, encodedFuzzyName]);
      if (res1.rowCount > 0) console.log(`Updated ${res1.rowCount} in appointment_documents for ${filename}`);

      const q2 = `
        UPDATE appointments 
        SET document_url = $1 
        WHERE (document_url ILIKE $2 OR document_url ILIKE $3 OR replace(document_url, '%20', ' ') ILIKE $2)
        AND document_url NOT LIKE '%lrunrunv4trazfok%'
      `;
      const res2 = await client.query(q2, [blob.url, fuzzyName, encodedFuzzyName]);
      if (res2.rowCount > 0) console.log(`Updated ${res2.rowCount} in appointments for ${filename}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

ultraRepair();
