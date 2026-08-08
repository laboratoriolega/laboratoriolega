const XLSX = require('xlsx');
const { Pool } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const DATABASE_URL = env.match(/DATABASE_URL=(.*)/)[1].trim();

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateSheet(ws, sheetName, numCols, emptyPrefixes, heuristicFn) {
    console.log(`\nLimpiando '${sheetName}'...`);
    await pool.query('DELETE FROM prestaciones_data WHERE sheet_name = $1', [sheetName]);

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    console.log(`Migrando '${sheetName}' (${data.length} filas en Excel)...`);

    let rowIndex = 0;
    let inserted = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        let first = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : '';
        const second = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : '';

        // Inject DUMMY TITLE for Cotizador so row 0-2 can be DATA
        if (sheetName === 'Cotizador' && i === 0) {
            await pool.query(
                `INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)`,
                [sheetName, rowIndex++, JSON.stringify({ __EMPTY: "Maria Andrea Delgado (Parámetros)", meta_part: 'TITLE' })]
            );
        }

        // Split TITLE and HEADER for PAMI patients
        if (sheetName === 'Federacion-PAMI' && (second === 'Costo' || second === 'COBRADO' || second === 'Importe')) {
            await pool.query(
                `INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)`,
                [sheetName, rowIndex++, JSON.stringify({ __EMPTY: first, meta_part: 'TITLE' })]
            );
            first = "Prestaciones";
            row[0] = "Prestaciones";
        }

        // Check Convenios Particulares TITLE
        const hasOtherCols = row.slice(1).some(v => v !== null && v !== '');
        
        let metaPart = 'DATA';
        if (sheetName === 'Cotizador') {
            if (first === 'Prestaciones ') metaPart = 'HEADER';
            else if (first.startsWith('NOTA:')) metaPart = 'NOTE';
            else metaPart = 'DATA';
        } else if (sheetName === 'Federacion-PAMI') {
            if (first === 'Prestaciones') metaPart = 'HEADER';
            else if (first.startsWith('NOTA:')) metaPart = 'NOTE';
            else metaPart = 'DATA';
        } else if (sheetName === 'Convenios Particulares') {
            if (first && !hasOtherCols && !first.startsWith('NOTA:')) metaPart = 'TITLE';
            else if (first === 'Prestaciones ') metaPart = 'HEADER';
            else if (first.startsWith('NOTA:')) metaPart = 'NOTE';
            else if (first.toLowerCase().includes('valores')) metaPart = 'SUBTITLE';
            else metaPart = 'DATA';
        }

        // Skip completely empty rows
        if (!row.some(v => v !== null && v !== '')) continue;
        
        // Skip rows without first column UNLESS they have data elsewhere (Cotizador row 1 has % values!)
        if (!first && !hasOtherCols) continue;

        const rowData = {};
        rowData['meta_part'] = metaPart;

        for (let col = 0; col < numCols; col++) {
            let colKey = col === 0 ? '__EMPTY' : `__EMPTY_${col}`;
            // Override with specific emptyPrefixes if provided
            if (emptyPrefixes && emptyPrefixes[col]) {
                colKey = emptyPrefixes[col];
            }

            const cellAddress = XLSX.utils.encode_cell({ r: i, c: col });
            const cell = ws[cellAddress];

            if (cell && (cell.f || (cell.v !== null && cell.v !== undefined))) {
                rowData[colKey] = cell.f ? '=' + cell.f : cell.v;
            } else {
                rowData[colKey] = '';
            }
        }

        await pool.query(
            `INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)`,
            [sheetName, rowIndex++, JSON.stringify(rowData)]
        );
        inserted++;
    }

    console.log(`  => ${inserted} filas insertadas en '${sheetName}'.\n`);
}

async function run() {
    try {
        const wb = XLSX.readFile('public/Listado de Prestaciones.xlsx');

        await migrateSheet(wb.Sheets['Cotizador'], 'Cotizador', 9);
        await migrateSheet(wb.Sheets['Federacion-PAMI'], 'Federacion-PAMI', 13);
        await migrateSheet(wb.Sheets['Convenios Particulares'], 'Convenios Particulares', 7);

        console.log('✅ Migración completa.');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
