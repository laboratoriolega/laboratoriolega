const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL=(.*)/);
const DATABASE_URL = dbUrlMatch[1].trim();

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

/**
 * Migra una hoja del Excel a la DB.
 * Usa SIEMPRE cell.v (valor calculado) para que las fórmulas se vean como sus resultados.
 * 
 * @param {object} ws        - Worksheet de XLSX
 * @param {string} sheetName - Nombre de la sheet en la DB
 * @param {number} maxCols   - Cuántas columnas A-Z tomar
 * @param {string[]} priceCols - Claves __EMPTY_N que son precios (para METADATA)
 * @param {function} detectMeta - Función (row[], rowIndex) => metaPart string
 */
async function migrateSheet(ws, sheetName, maxCols, priceCols, detectMeta) {
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

    console.log(`\nLimpiando '${sheetName}'...`);
    await pool.query("DELETE FROM prestaciones_data WHERE sheet_name = $1", [sheetName]);

    console.log(`Migrando '${sheetName}' (${data.length} filas en Excel)...`);
    let insertedIndex = 0;
    let metaInserted = false;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || !row.some(v => v !== null && v !== undefined && v !== '')) continue;

        const firstCell = String(row[0] || '').trim();
        const metaPart = detectMeta(row, i, firstCell);
        if (!metaPart) continue; // skip this row

        const rowData = { meta_part: metaPart };

        // Leer celdas usando SIEMPRE cell.v (valor calculado, no fórmulas)
        for (let j = 0; j < maxCols; j++) {
            const colKey = j === 0 ? '__EMPTY' : `__EMPTY_${j}`;
            const cellAddr = XLSX.utils.encode_cell({ r: i, c: j });
            const cell = ws[cellAddr];
            if (cell && cell.v !== null && cell.v !== undefined) {
                rowData[colKey] = cell.v;
            } else {
                rowData[colKey] = '';
            }
        }

        // Insertar fila METADATA antes del HEADER (la primera vez que aparece un HEADER)
        if (metaPart === 'HEADER' && !metaInserted) {
            metaInserted = true;
            const meta = { '__EMPTY': '__METADATA__', meta_part: 'METADATA' };
            priceCols.forEach(c => { meta[c] = 'price'; });
            await pool.query(
                "INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)",
                [sheetName, insertedIndex++, JSON.stringify(meta)]
            );
        }

        await pool.query(
            "INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)",
            [sheetName, insertedIndex++, JSON.stringify(rowData)]
        );

        if (insertedIndex % 20 === 0) process.stdout.write('.');
    }

    console.log(`\n  => ${insertedIndex} filas insertadas en '${sheetName}'.`);
}

async function migrate() {
    const wb = XLSX.readFile('./public/Listado de Prestaciones.xlsx');

    // ─── 1. COTIZADOR (Maria Andrea Delgado) ─────────────────────────────────
    await migrateSheet(
        wb.Sheets['Cotizador'],
        'Cotizador',
        9, // Cols A-I
        ['__EMPTY_1', '__EMPTY_4', '__EMPTY_5', '__EMPTY_6', '__EMPTY_7', '__EMPTY_8'],
        (row, i, first) => {
            if (i === 0) return 'TITLE';
            if (i === 1) return null; // fila de % extra — omitir
            if (first.toLowerCase().includes('valores actualizados')) return 'SUBTITLE';
            if (first.toLowerCase().startsWith('prestacion') || first === 'Prestaciones ') return 'HEADER';
            if (first.includes('NOTA:')) return 'NOTE';
            if (!first) return null;
            return 'DATA';
        }
    );

    // ─── 2. FEDERACION-PAMI ───────────────────────────────────────────────────
    // La hoja tiene múltiples secciones (un paciente por sección).
    // Heurística: si la fila tiene texto en col 0 y valores en otras → TITLE o DATA.
    await migrateSheet(
        wb.Sheets['Federacion-PAMI'],
        'Federacion-PAMI',
        12, // Cols A-L (las más relevantes)
        ['__EMPTY_1', '__EMPTY_2', '__EMPTY_3', '__EMPTY_4', '__EMPTY_5', '__EMPTY_6', '__EMPTY_7'],
        (row, i, first) => {
            if (!first) return null;
            // Fila de cabecera principal (header)
            if (first === ' ' || first.toUpperCase().includes('PRESUPUESTO') || first.toUpperCase().includes('FACTURA')) return null;
            // Si la fila solo tiene texto en col 0 y nada de números → TITLE
            const hasNumbers = row.slice(1).some(v => typeof v === 'number');
            const col1 = row[1];
            if (!hasNumbers && (!col1 || typeof col1 === 'string')) {
                // Es un nombre de paciente/sección
                return 'TITLE';
            }
            // Si col 0 es texto tipo columna header (Costo, UB, etc.)
            if (typeof col1 === 'string' && col1.trim().length > 0 && !hasNumbers) return 'HEADER';
            return 'DATA';
        }
    );

    // ─── 3. CONVENIOS PARTICULARES ────────────────────────────────────────────
    await migrateSheet(
        wb.Sheets['Convenios Particulares'],
        'Convenios Particulares',
        7, // Cols A-G
        ['__EMPTY_1', '__EMPTY_2'],
        (row, i, first) => {
            if (!first) return null;
            if (i === 0) return 'TITLE';
            if (first.toLowerCase().includes('valores') || first.toLowerCase().includes('precio')) return 'SUBTITLE';
            if (first.toLowerCase().startsWith('prestacion') || first === 'Prestaciones ') return 'HEADER';
            if (first.includes('NOTA:')) return 'NOTE';
            return 'DATA';
        }
    );

    await pool.end();
    console.log('\n✅ Migración completa.');
}

migrate().catch(err => { console.error('Error:', err); process.exit(1); });
