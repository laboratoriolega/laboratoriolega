import { list, put } from '@vercel/blob';
import pg from 'pg';
const { Client } = pg;

const OLD_BLOB_TOKEN = "vercel_blob_rw_8MsIKHGpHbCX6ijs_YlVWjOVsQVc6L49p34NQrb6vOudniG";
const NEW_BLOB_TOKEN = "vercel_blob_rw_LrunrUnV4TRAzFoK_dgzXiJaXD56myVT06tNZiSFN2RIXsU";
const TARGET_DB_URL = 'postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function sync() {
  const targetDb = new Client({ connectionString: TARGET_DB_URL });

  try {
    await targetDb.connect();
    console.log("Connected to target database.");

    console.log("Listing blobs from old storage...");
    const { blobs } = await list({ token: OLD_BLOB_TOKEN });
    console.log(`Found ${blobs.length} blobs in old storage.`);

    if (blobs.length === 0) {
      console.log("No blobs to migrate.");
      return;
    }

    const urlMapping = new Map();

    for (const blob of blobs) {
      console.log(`Migrating: ${blob.pathname}...`);
      
      try {
        // Download
        const response = await fetch(blob.url);
        const buffer = await response.arrayBuffer();
        
        // Upload to new storage
        const newBlob = await put(blob.pathname, Buffer.from(buffer), {
          access: 'public',
          token: NEW_BLOB_TOKEN,
          contentType: blob.contentType
        });
        
        console.log(`Uploaded to new storage: ${newBlob.url}`);
        urlMapping.set(blob.url, newBlob.url);
      } catch (e) {
        console.error(`Failed to migrate blob ${blob.url}:`, e);
      }
    }

    console.log("\nUpdating database URLs...");

    // Update appointment_documents
    const docs = await targetDb.query("SELECT id, document_url FROM appointment_documents");
    for (const doc of docs.rows) {
      const newUrl = urlMapping.get(doc.document_url);
      if (newUrl) {
        await targetDb.query("UPDATE appointment_documents SET document_url = $1 WHERE id = $2", [newUrl, doc.id]);
        console.log(`Updated document ID ${doc.id}`);
      }
    }

    // Update appointments (cover cases where document_url might be used directly)
    const apps = await targetDb.query("SELECT id, document_url FROM appointments WHERE document_url IS NOT NULL");
    for (const app of apps.rows) {
      const newUrl = urlMapping.get(app.document_url);
      if (newUrl) {
        await targetDb.query("UPDATE appointments SET document_url = $1 WHERE id = $2", [newUrl, app.id]);
        console.log(`Updated appointment ID ${app.id}`);
      }
    }

    console.log("\nBlob synchronization and database update completed successfully!");

  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    await targetDb.end();
  }
}

sync();
