import XLSX from 'xlsx';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Client } = pg;
const DB_URL = "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
const filePath = path.join(process.cwd(), 'public', 'Listado de Prestaciones OK.xlsx');

async function importStructured() {
  if (!fs.existsSync(filePath)) return;

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellText: true });
  
  try {
    console.log("Cleaning old data...");
    await client.query("DELETE FROM prestaciones_data");
    await client.query("DELETE FROM prestaciones_sections");

    for (const sheetName of workbook.SheetNames) {
      console.log(`Processing sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

      let currentSectionId = null;
      let currentSectionHeaders = null;
      let sectionIndex = 0;

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Skip empty rows
        if (!row || row.every(c => c === null || c === '')) continue;

        // HEURISTIC: Detection of Section Header (Laboratorio Name)
        // Usually, a section header has text in column A or B and mostly nulls elsewhere
        const nonNulls = row.filter(c => c !== null && c !== '').length;
        const firstValue = row.find(c => c !== null && c !== '');
        
        // If it's a single value in the row, it might be a Title or Note
        if (nonNulls === 1 && typeof firstValue === 'string') {
          if (firstValue.startsWith("NOTA:") || firstValue.startsWith("Nota:")) {
            if (currentSectionId) {
              await client.query("UPDATE prestaciones_sections SET note = $1 WHERE id = $2", [firstValue, currentSectionId]);
            }
            continue;
          }
          
          if (firstValue.length > 5 && !firstValue.includes("Valores") && !firstValue.includes("Prestaciones")) {
            // New Section Detected!
            console.log(`Found Section: ${firstValue}`);
            const subtitleRows = rawData[i+1];
            const subtitle = (subtitleRows && subtitleRows.find(c => String(c).includes("Valores"))) ? subtitleRows.find(c => String(c).includes("Valores")) : null;
            
            const secRes = await client.query(
              "INSERT INTO prestaciones_sections (sheet_name, title, subtitle, row_index) VALUES ($1, $2, $3, $4) RETURNING id",
              [sheetName, firstValue, subtitle, sectionIndex++]
            );
            currentSectionId = secRes.rows[0].id;
            currentSectionHeaders = null; // Reset headers for new section
            if (subtitle) i++; // skip subtitle row if detected
            continue;
          }
        }

        // HEURISTIC: Headers detection
        if (row.some(c => String(c).toLowerCase().includes("prestaciones"))) {
          currentSectionHeaders = row.filter(c => c !== null);
          if (currentSectionId) {
            await client.query("UPDATE prestaciones_sections SET headers = $1 WHERE id = $2", [JSON.stringify(currentSectionHeaders), currentSectionId]);
          }
          continue;
        }

        // DATA ROWS
        if (currentSectionId && currentSectionHeaders) {
           const rowObject = {};
           currentSectionHeaders.forEach((header, idx) => {
             const headerRow = rawData.find(r => r && r.some(c => c && String(c).toLowerCase().includes("prestaciones")));
             const cellIdx = headerRow.indexOf(header);
             rowObject[header] = row[cellIdx];
           });

           await client.query(
             "INSERT INTO prestaciones_data (sheet_name, row_data, row_index, section_id) VALUES ($1, $2, $3, $4)",
             [sheetName, JSON.stringify(rowObject), i, currentSectionId]
           );
        } else if (!currentSectionId) {
           // Fallback for sheets without sections
           // We'll create a default section for the sheet
           const secRes = await client.query(
              "INSERT INTO prestaciones_sections (sheet_name, title, row_index) VALUES ($1, $2, $3) RETURNING id",
              [sheetName, "General", 0]
            );
            currentSectionId = secRes.rows[0].id;
            // Find headers for this sheet
            const headerRow = rawData.find(r => r && r.length > 2); // Heuristic for header row
            currentSectionHeaders = headerRow ? headerRow.filter(c => c !== null) : ["ID", "Valor"];
            await client.query("UPDATE prestaciones_sections SET headers = $1 WHERE id = $2", [JSON.stringify(currentSectionHeaders), currentSectionId]);
            i--; // re-process this row as data
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
    console.log("Structured import complete.");
  }
}

importStructured();
