import XLSX from 'xlsx';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Client } = pg;
const DB_URL = "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
const filePath = path.join(process.cwd(), 'public', 'Listado de Prestaciones OK.xlsx');

async function importExcel() {
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return;
  }

  const client = new Client({ connectionString: DB_URL });
  const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellText: true });
  const sheetNames = workbook.SheetNames;

  try {
    await client.connect();
    console.log("Connected to database. Cleaning old data...");
    await client.query("DELETE FROM prestaciones_data");

    for (const sheetName of sheetNames) {
      console.log(`Importing sheet: ${sheetName}...`);
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with empty cells handled
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
      
      for (let i = 0; i < rows.length; i++) {
        await client.query(
          "INSERT INTO prestaciones_data (sheet_name, row_data, row_index) VALUES ($1, $2, $3)",
          [sheetName, JSON.stringify(rows[i]), i]
        );
      }
      console.log(`Imported ${rows.length} rows from ${sheetName}.`);
    }

    console.log("IMPORT FINISHED SUCCESSFULLY.");
  } catch (error) {
    console.error("Import failed:", error);
  } finally {
    await client.end();
  }
}

importExcel();
