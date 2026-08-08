const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL=(.*)/);
const DATABASE_URL = dbUrlMatch[1].trim();

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const workbook = XLSX.readFile('./public/Listado de Prestaciones.xlsx');
    const sheetName = 'Cotizador';
    const sheet = workbook.Sheets[sheetName];
    
    if (!sheet) {
        console.error(`Hoja '${sheetName}' no encontrada en el Excel.`);
        process.exit(1);
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    console.log(`Limpiando datos existentes de '${sheetName}'...`);
    await pool.query("DELETE FROM prestaciones_data WHERE sheet_name = $1", [sheetName]);
    
    console.log(`Migrando '${sheetName}'... (${data.length} filas totales en el Excel)`);
    
    let inserted = 0;
    const MAX_COLS = 9; // Columnas A-I: Prestaciones, Derivación, Derivante, Grupo, Envío, Costos Indirectos, COBICO, Derivación(%), Particular(%)

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Saltar filas completamente vacías
        if (!row || !row.some(v => v !== null && v !== undefined && v !== '')) {
            continue;
        }

        const firstCell = String(row[0] || '').trim();

        // Determinar meta_part
        let metaPart;
        if (i === 0) {
            metaPart = 'TITLE';
        } else if (i === 1) {
            // Fila con porcentajes adicionales — la guardamos como DATA de configuracion
            metaPart = 'DATA';
        } else if (firstCell.toLowerCase().includes('valores actualizados')) {
            metaPart = 'SUBTITLE';
        } else if (firstCell.toLowerCase().startsWith('prestacion') || firstCell === 'Prestaciones ') {
            // Fila de cabecera de columnas
            metaPart = 'HEADER';
        } else if (firstCell.includes('NOTA:')) {
            metaPart = 'NOTE';
        } else if (firstCell === '' || firstCell === 'null' || !firstCell) {
            continue; // Saltar filas sin nombre de prestación
        } else {
            metaPart = 'DATA';
        }

        const rowData = {};
        rowData['meta_part'] = metaPart;

        for (let j = 0; j < MAX_COLS; j++) {
            const colKey = j === 0 ? '__EMPTY' : `__EMPTY_${j}`;
            const cellAddress = XLSX.utils.encode_cell({ r: i, c: j });
            const cell = sheet[cellAddress];

            if (cell) {
                if (cell.f) {
                    // Guardar fórmulas como =formula
                    rowData[colKey] = '=' + cell.f;
                } else if (cell.v !== null && cell.v !== undefined) {
                    rowData[colKey] = cell.v;
                } else {
                    rowData[colKey] = '';
                }
            } else {
                rowData[colKey] = '';
            }
        }

        // Agregar METADATA row después del HEADER para que el sistema sepa qué columnas son precio
        if (metaPart === 'HEADER') {
            // Insertar primero la fila METADATA (tipos de columnas)
            const metaRowData = {
                '__EMPTY': '__METADATA__',
                'meta_part': 'METADATA',
                '__EMPTY_1': 'price',  // Derivación $
                '__EMPTY_2': 'text',   // Derivante
                '__EMPTY_3': 'text',   // Grupo
                '__EMPTY_4': 'price',  // Envío
                '__EMPTY_5': 'price',  // Costos Indirectos
                '__EMPTY_6': 'price',  // COBICO
                '__EMPTY_7': 'price',  // Derivación %
                '__EMPTY_8': 'price',  // Particular
            };
            await pool.query(
                "INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)",
                [sheetName, inserted * 2, JSON.stringify(metaRowData)]
            );
            inserted++;
        }

        // Colores estéticos
        if (metaPart === 'TITLE') {
            rowData['__row_color'] = '#1a3a5c';
        }
        if (metaPart === 'HEADER') {
            const headerColor = '#244c7d';
            for (let j = 0; j < MAX_COLS; j++) {
                const colKey = j === 0 ? '__EMPTY' : `__EMPTY_${j}`;
                rowData[`__cell_color_${colKey}`] = headerColor;
            }
        }

        await pool.query(
            "INSERT INTO prestaciones_data (sheet_name, row_index, row_data) VALUES ($1, $2, $3)",
            [sheetName, inserted * 2 + 1, JSON.stringify(rowData)]
        );
        inserted++;

        if (inserted % 10 === 0) process.stdout.write('.');
    }
    
    console.log(`\nMigración '${sheetName}' completada: ${inserted} filas insertadas.`);
    await pool.end();
}

migrate().catch(err => {
    console.error('Error en migración:', err);
    process.exit(1);
});
