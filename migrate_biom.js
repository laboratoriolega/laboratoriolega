const { Client } = require('pg');

const sheetName = 'Panel BioM. Int.Panel';

const dataToInsert = [
  { row_index: 0, row_data: { __EMPTY: "Panel Biomarcador Institucional", meta_part: "TITLE" } },
  { row_index: 1, row_data: { __EMPTY: "Valores actualizados al mes de Agosto 2025", __EMPTY_7: "-37.5%", meta_part: "SUBTITLE" } },
  { row_index: 2, row_data: { __EMPTY_4: "12%", __EMPTY_10: "25%", meta_part: "METADATA" } }, // E3 = 12%, K3 = 25% (row 3 is index 2)
  { row_index: 3, row_data: { 
      __EMPTY: "Prestaciones", __EMPTY_1: "Derivación", __EMPTY_2: "DERIVACION", __EMPTY_3: "Envío", __EMPTY_4: "Costo Interno", 
      __EMPTY_5: "Costo Total", __EMPTY_6: "COBICO", __EMPTY_7: "PARTICULAR", __EMPTY_8: "O.SOCIAL MINIMO", __EMPTY_9: "DERIVACION", __EMPTY_10: "Margen", 
      meta_part: "HEADER" 
    } 
  },
  { row_index: 4, row_data: { 
      __EMPTY: "ELASTASA", __EMPTY_1: 85049, __EMPTY_2: "CIBIC", __EMPTY_3: 0, __EMPTY_4: "=B5*$E$3", 
      __EMPTY_5: "=SUMA(B5:E5)", __EMPTY_6: 168600, __EMPTY_7: "=G5*0.9", __EMPTY_8: "=H5*0.8", __EMPTY_9: "=H5*0.8", __EMPTY_10: "=I5-F5",
      meta_part: "DATA" 
    } 
  },
  { row_index: 5, row_data: { 
      __EMPTY: "ALFA 1 ANTITRIPSINA", __EMPTY_1: 7197.36, __EMPTY_2: "GORNITZ", __EMPTY_3: 0, __EMPTY_4: "=B6*$E$3", 
      __EMPTY_5: "=SUMA(B6:E6)", __EMPTY_6: 0, __EMPTY_7: 22000, __EMPTY_8: "=H6*0.8", __EMPTY_9: "=H6*0.8", __EMPTY_10: "=I6-F6",
      meta_part: "DATA" 
    } 
  },
  { row_index: 6, row_data: { 
      __EMPTY: "CALPROTECTINA", __EMPTY_1: 32697.94, __EMPTY_2: "MANLAB", __EMPTY_3: 0, __EMPTY_4: "=B7*$E$3", 
      __EMPTY_5: "=SUMA(B7:E7)", __EMPTY_6: 157500, __EMPTY_7: "=G7*0.9", __EMPTY_8: "=H7*0.8", __EMPTY_9: "=H7*0.8", __EMPTY_10: "=I7-F7",
      meta_part: "DATA" 
    } 
  },
  { row_index: 7, row_data: { 
      __EMPTY: "ZONULINA", __EMPTY_1: 134400, __EMPTY_2: "IACA", __EMPTY_3: 20000, __EMPTY_4: "=B8*$E$3", 
      __EMPTY_5: "=SUMA(B8:E8)", __EMPTY_6: 0, __EMPTY_7: "=F8/(1+$H$2)", __EMPTY_8: "=H8*0.8", __EMPTY_9: "=H8*0.8", __EMPTY_10: "=I8-F8",
      meta_part: "DATA" 
    } 
  },
  { row_index: 8, row_data: { __EMPTY: "", meta_part: "DATA" } }, // Empty grey row 9
  { row_index: 9, row_data: { 
      __EMPTY: "PANEL COMPLETO", __EMPTY_1: "=SUMA(B5:B8)", __EMPTY_2: "", __EMPTY_3: "=SUMA(D5:D8)", __EMPTY_4: "=SUMA(E5:E8)", 
      __EMPTY_5: "=SUMA(F5:F8)", __EMPTY_6: 0, __EMPTY_7: "=SUMA(H5:H8)*(1-$H$11)", __EMPTY_8: "=SUMA(I5:I8)*(1-$I$11)", __EMPTY_9: "=SUMA(J5:J8)*(1-$I$11)", __EMPTY_10: "=I10-F10",
      meta_part: "DATA" 
    } 
  },
  { row_index: 10, row_data: { __EMPTY_7: "10%", __EMPTY_8: "5%", meta_part: "DATA" } } // H11 = 10%, I11 = 5%
];

async function migrate() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  await client.connect();
  
  console.log(`Borrando datos viejos para ${sheetName}...`);
  await client.query('DELETE FROM prestaciones_data WHERE sheet_name = $1', [sheetName]);

  console.log(`Insertando ${dataToInsert.length} filas nuevas estructuradas con formulas...`);
  for (const row of dataToInsert) {
    await client.query(
      'INSERT INTO prestaciones_data (sheet_name, row_data, row_index) VALUES ($1, $2, $3)',
      [sheetName, JSON.stringify(row.row_data), row.row_index]
    );
  }

  console.log('Migración completada con éxito.');
  await client.end();
}

migrate().catch(console.error);
