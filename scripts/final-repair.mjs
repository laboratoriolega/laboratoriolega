import { list } from '@vercel/blob';
import pg from 'pg';
const { Client } = pg;

// CONFIGURATION
const TARGET_BLOB_TOKEN = "vercel_blob_rw_LrunrUnV4TRAzFoK_dgzXiJaXD56myVT06tNZiSFN2RIXsU";
const TARGET_DB_URL = "postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function finalRepair() {
  const client = new Client({ connectionString: TARGET_DB_URL });
  
  try {
    await client.connect();
    console.log("Connected to PRODUCTION database.");

    console.log("Listing blobs from TARGET storage...");
    const { blobs } = await list({ token: TARGET_BLOB_TOKEN });
    console.log(`Found ${blobs.length} blobs in target.`);

    for (const blob of blobs) {
      if (blob.pathname === 'test-write.txt' || blob.pathname === 'test.txt') continue;

      // Extract raw filename for fuzzy matching
      const filename = blob.pathname.split('/').pop();
      if (!filename) continue;

      console.log(`Fuzzy matching for: ${filename} (URL: ${blob.url})`);

      // Update appointment_documents
      const res1 = await client.query(
        "UPDATE appointment_documents SET document_url = $1 WHERE document_url LIKE $2 AND document_url NOT LIKE $3",
        [blob.url, `%${filename}%`, `%lrunrunv4trazfok%`]
      );
      if (res1.rowCount > 0) console.log(`  -> Updated ${res1.rowCount} in appointment_documents`);

      // Update appointments
      const res2 = await client.query(
        "UPDATE appointments SET document_url = $1 WHERE document_url LIKE $2 AND document_url NOT LIKE $3",
        [blob.url, `%${filename}%`, `%lrunrunv4trazfok%`]
      );
      if (res2.rowCount > 0) console.log(`  -> Updated ${res2.rowCount} in appointments`);

      // Update users (avatars)
      const res3 = await client.query(
        "UPDATE users SET avatar_url = $1 WHERE avatar_url LIKE $2 AND avatar_url NOT LIKE $3",
        [blob.url, `%${filename}%`, `%lrunrunv4trazfok%`]
      );
      if (res3.rowCount > 0) console.log(`  -> Updated ${res3.rowCount} in users`);
    }

    console.log("\nFINAL REPAIR COMPLETED!");

  } catch (error) {
    console.error("Repair failed:", error);
  } finally {
    await client.end();
  }
}

finalRepair();
