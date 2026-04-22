import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const BLOB_TOKEN = "vercel_blob_rw_8MsIKHGpHbCX6ijs_YlVWjOVsQVc6L49p34NQrb6vOudniG";
const DOWNLOAD_DIR = path.join(process.cwd(), 'tmp', 'blobs');

async function downloadBlobs() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  try {
    console.log("Listing blobs...");
    const { blobs } = await list({ token: BLOB_TOKEN });
    console.log(`Found ${blobs.length} blobs.`);

    for (const blob of blobs) {
      const fileName = path.basename(blob.pathname);
      const filePath = path.join(DOWNLOAD_DIR, fileName);
      
      console.log(`Downloading ${fileName}...`);
      const response = await fetch(blob.url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));
    }

    console.log(`Successfully downloaded ${blobs.length} files to ${DOWNLOAD_DIR}`);

  } catch (error) {
    console.error("Blob download failed:", error);
  }
}

downloadBlobs();
