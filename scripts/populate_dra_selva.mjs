import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function populate() {
    const client = new Client({ connectionString });
    await client.connect();
    console.log("Connected to DB");

    const sheetName = "Dra. Selva";
    const mainKey = "__EMPTY";

    const rows = [
        // Structural Rows
        { row_data: { [mainKey]: "Dra. Selva", "meta_part": "TITLE" }, row_index: 0 },
        { row_data: { [mainKey]: "Valores actualizados al mes de ABRIL2026", "meta_part": "SUBTITLE" }, row_index: 1 },
        { row_data: { [mainKey]: "__METADATA__", "__EMPTY_1": "price", "meta_part": "METADATA" }, row_index: 2 },
        { row_data: { [mainKey]: "Prestaciones", "__EMPTY_1": "Importe", "meta_part": "HEADER" }, row_index: 3 },

        // Data Rows
        { row_data: { [mainKey]: "ESTUDIO MICROBIOMA INTESTINAL", "__EMPTY_1": "448649.55", "meta_part": "DATA" }, row_index: 4 },
        { row_data: { [mainKey]: "DAO", "__EMPTY_1": "316193.13", "meta_part": "DATA" }, row_index: 5 },
        { row_data: { [mainKey]: "ALFA 1 ANTITRIPSINA (Mat Fecal)", "__EMPTY_1": "27720.00", "meta_part": "DATA" }, row_index: 6 },
        { row_data: { [mainKey]: "ALFA 1 ANTITRIPSINA CLEARENCE", "__EMPTY_1": "27720.00", "meta_part": "DATA" }, row_index: 7 },
        { row_data: { [mainKey]: "ALFA 1 ANTITRIPSINA EN SUERO", "__EMPTY_1": "27720.00", "meta_part": "DATA" }, row_index: 8 },
        { row_data: { [mainKey]: "CALPROTECTINA CUANTITATIVA", "__EMPTY_1": "138600.00", "meta_part": "DATA" }, row_index: 9 },
        { row_data: { [mainKey]: "ELASTASA EN MATERIA FECAL", "__EMPTY_1": "166320.00", "meta_part": "DATA" }, row_index: 10 },
        { row_data: { [mainKey]: "ZONULINA", "__EMPTY_1": "272844.80", "meta_part": "DATA" }, row_index: 11 },
        { row_data: { [mainKey]: "PANEL DE PERMEABILIDAD INTESTINAL(Zonulina-Elastasa-Calprotectina-Alfa 1 Antitripsina)", "__EMPTY_1": "532826.62", "meta_part": "DATA" }, row_index: 12 },
        { row_data: { [mainKey]: "AG HELICOBACTER PYLORI", "__EMPTY_1": "38808.00", "meta_part": "DATA" }, row_index: 13 },
        { row_data: { [mainKey]: "TEST AIRE ESP . LACTOSA", "__EMPTY_1": "84000.00", "meta_part": "DATA" }, row_index: 14 },
        { row_data: { [mainKey]: "TEST AIRE ESP. FRUCTUOSA", "__EMPTY_1": "84000.00", "meta_part": "DATA" }, row_index: 15 },
        { row_data: { [mainKey]: "TEST AIRE ESP. SIBO", "__EMPTY_1": "88000.00", "meta_part": "DATA" }, row_index: 16 },
        { row_data: { [mainKey]: "TEST AIRE ESP. H PYLORI", "__EMPTY_1": "140000.00", "meta_part": "DATA" }, row_index: 17 },
        { row_data: { [mainKey]: "TEST DE INTOLERANCIA ALIMENTARIA 105 ALIMENTOS", "__EMPTY_1": "135000.00", "meta_part": "DATA" }, row_index: 18 },
        { row_data: { [mainKey]: "TEST DE INTOLERANCIA ALIMENTARIA 63 ALIMENTOS", "__EMPTY_1": "92000.00", "meta_part": "DATA" }, row_index: 19 },
        { row_data: { [mainKey]: "ALEX 2", "__EMPTY_1": "888392.07", "meta_part": "DATA" }, row_index: 20 },
        { row_data: { [mainKey]: "HLA DQ2/DQ8", "__EMPTY_1": "221760.00", "meta_part": "DATA" }, row_index: 21 },
    ];

    console.log(`Inserting ${rows.length} rows for ${sheetName}...`);

    for (const row of rows) {
        await client.query(
            "INSERT INTO prestaciones_data (sheet_name, row_data, row_index) VALUES ($1, $2, $3)",
            [sheetName, JSON.stringify(row.row_data), row.row_index]
        );
    }

    console.log("Migration completed successfully!");
    await client.end();
}

populate().catch(console.error);
