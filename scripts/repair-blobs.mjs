import { list, put } from '@vercel/blob';
import pg from 'pg';
const { Client } = pg;

// CONFIGURATION
const SOURCE_BLOB_TOKEN = "vercel_blob_rw_8MsIKHGpHbCX6ijs_YlVWjOVsQVc6L49p34NQrb6vOudniG";
const TARGET_BLOB_TOKEN = "vercel_blob_rw_LrunrUnV4TRAzFoK_dgzXiJaXD56myVT06tNZiSFN2RIXsU";
const TARGET_DB_URL = "postgresql://neondb_owner:npg_L5PDKCSB4lhf@ep-gentle-star-an2yqhb2-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function repair() {
  const client = new Client({ connectionString: TARGET_DB_URL });
  
  try {
    await client.connect();
    console.log("Connected to PRODUCTION database.");

    const urlMapping = new Map(); // Pathname (lowercased) -> New URL

    console.log("Listing blobs from TARGET storage (to find existing files)...");
    const targetData = await list({ token: TARGET_BLOB_TOKEN });
    console.log(`Found ${targetData.blobs.length} blobs already in target storage.`);
    for (const b of targetData.blobs) {
      urlMapping.set(b.pathname.toLowerCase(), b.url);
    }

    console.log("Listing blobs from SOURCE storage...");
    const { blobs: sourceBlobs } = await list({ token: SOURCE_BLOB_TOKEN });
    console.log(`Found ${sourceBlobs.length} blobs in source storage.`);
    console.log("Keys in urlMapping:", [...urlMapping.keys()].slice(0, 10), `... (Total: ${urlMapping.size})`);

    for (const blob of sourceBlobs) {
      const pathname = blob.pathname.toLowerCase();
      
      if (urlMapping.has(pathname)) {
        console.log(`  - Already in target: ${blob.pathname}`);
        continue;
      }

      console.log(`Migrating: ${blob.pathname}...`);
      try {
        const response = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${SOURCE_BLOB_TOKEN}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        const newBlob = await put(blob.pathname, Buffer.from(buffer), {
          access: 'private',
          token: TARGET_BLOB_TOKEN,
          contentType: blob.contentType
        });
        
        console.log(`  -> New URL: ${newBlob.url}`);
        urlMapping.set(pathname, newBlob.url);
      } catch (e) {
        console.error(`  !! Failed ${blob.pathname}:`, e.message);
      }
    }

    console.log("\nUpdating database records...");

    const extractPathname = (url) => {
      if (!url) return "";
      try {
        const decodedUrl = decodeURIComponent(url);
        const urlObj = new URL(decodedUrl);
        let p = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
        // Handle specific case where pathname might be inside a sub-folder
        return p.toLowerCase();
      } catch (e) {
        const decodedUrl = decodeURIComponent(url);
        const parts = decodedUrl.split('.com/');
        let p = parts.length > 1 ? parts[1].split('?')[0] : decodedUrl;
        return p.toLowerCase();
      }
    };

    // Helper to update table
    const updateTable = async (tableName, urlColumn) => {
      const { rows } = await client.query(`SELECT id, ${urlColumn} FROM ${tableName} WHERE ${urlColumn} IS NOT NULL`);
      let updated = 0;
      console.log(`Checking ${rows.length} records in ${tableName}...`);
      for (const row of rows) {
        const currentUrl = row[urlColumn];
        if (currentUrl.includes("lrunrunv4trazfok")) {
          // console.log(`  ID ${row.id}: Already updated.`);
          continue;
        }

        const pathname = extractPathname(currentUrl);
        const newUrl = urlMapping.get(pathname);
        
        if (newUrl) {
          console.log(`  MATCH FOUND! ID ${row.id}: ${pathname} -> ${newUrl}`);
          await client.query(`UPDATE ${tableName} SET ${urlColumn} = $1 WHERE id = $2`, [newUrl, row.id]);
          updated++;
        } else {
          if (row.id === 73 || String(row.id) === '73') {
            console.log(`  [DEBUG ID 73] Pathname: "${pathname}"`);
            console.log(`  [DEBUG ID 73] Map has key: ${urlMapping.has(pathname)}`);
            console.log(`  [DEBUG ID 73] Map keys (first 5):`, [...urlMapping.keys()].slice(0, 5));
            // Find similar keys
            const similar = [...urlMapping.keys()].filter(k => k.includes('1776883061105'));
            console.log(`  [DEBUG ID 73] Similar keys in Map:`, similar);
          }
          console.log(`  NO MATCH for ID ${row.id}: "${pathname}"`);
        }
      }
      return updated;
    };

    const docsUpdated = await updateTable("appointment_documents", "document_url");
    console.log(`Updated ${docsUpdated} records in appointment_documents.`);

    const appsUpdated = await updateTable("appointments", "document_url");
    console.log(`Updated ${appsUpdated} records in appointments.`);

    const avatarsUpdated = await updateTable("users", "avatar_url");
    console.log(`Updated ${avatarsUpdated} avatars in users.`);

    console.log("\nREPAIR COMPLETED SUCCESSFULLY!");

  } catch (error) {
    console.error("Repair failed:", error);
  } finally {
    await client.end();
  }
}

repair();
