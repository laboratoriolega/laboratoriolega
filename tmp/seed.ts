import { Pool } from "pg";
import path from "path";
import fs from "fs";

// Manually load .env.local
let databaseUrl = "";
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    env.split("\n").forEach(line => {
      const parts = line.split("=");
      if (parts[0].trim() === "DATABASE_URL") {
        databaseUrl = parts.slice(1).join("=").trim().replace(/^"(.*)"$/, '$1');
      }
    });
  }
} catch (e) {}

const pool = new Pool({ connectionString: databaseUrl });

const analysisList = [
"IgG Helicobacter Pylori (sangre)", "Helicobacter Pylori (test de aire)", "Gases en sangre arteriales", "Gases en sangre venosos", "Ferritina", "Hormona anti mulleriana (HAM)", "M.T.H.F.R", "T3", "TSH", "T4L", "T3L", "FSH - Hormona Foliculo Estimulante", "Estradiol - E2", "Androstenediona", "Adolasa", "ATG - Ac. Anti Tiroglobulina", "ATPO - Ac. Anti Tiroperoxidasa", "Hemoglobina glicosilada - Hb A1C", "Dengue IgG", "Dengue IgM", "Observaciones", "Tiroglobulina - Tgs", "Toxoplasmosis IgG", "Toxoplasmosis IgM", "Examen fisico quimico MF", "IgA en MF", "Sangre oculta en MF", "Alfa 1 antitripsina en MF", "Calprotectina", "Elastasa", "Ag. Helicobater Pylori en MF", "Parasitologico", "Escobillado anal - Test de Graham", "Test de aire espirado SIBO - Lactosa - Fructuosa", "Cortisol AM (8hs)", "Cortisol PM (16hs)", "Urocultivo", "Prolactina (Prl)", "Esteatocrito en MF", "Hepatitis A IgG", "Hepatitis A IgM", "Hepatitis B Antigeno B superficie (Ag. Hbs)", "Hepatitis B Anticuerpo de superficie (Anti Hbs) - IgG", "Hepatitis B anti core (anti HbC) - IgG", "Hepatitis B anti core (anti HbC) - IgM", "Anti e - Hbe", "Antigeno E", "Hepatitis C - Anti HVC", "PSA Total - Antigeno Prostatico", "PSA Libre", "Indice Libre/Total", "Factor Antilupico", "Cardiolipinas IgM", "Cardiolipinas IgG", "Glicoproteinas IgG", "Glicoproteinas IgM", "BhCG - Sub Unidad Beta de Gonadotrofina Cronica - Hcg - Cualitativa", "BhCG - Sub Unidad Beta de Gonadotrofina Cronica - Hcg - Cuantitativa", "Gases en sangre (arterial)", "Gases en sangre (venas)", "Insulina 120", "CPK MB", "CPK", "FK 506 - tacrolimus", "Colesterol LDL", "Colesterol HDL", "Dhea-s (Sulfato de Dehidroepiandrosterona)", "Progesterona (pg)", "Progesterona 17 - Hidroxi (17 - OH - PG)", "HLA DQ2 - DQ8", "Intolerancia alimenticia (PANEL 63-105)", "Anti Transglutaminasa IgA", "Anti Gliadina Deaminada IgA", "Anti Gliadina Deaminada IgG", "Selenio", "Ca 19.9", "Vitamina D", "Vitamina B1", "Vitamina B12", "Vitamina A", "Zinc", "Cromo", "Vitamina C", "Reticulocitos", "Vitamina B6", "Vitamina E", "Cobre", "Ige Especifica", "ACTH - Hormona Adrenocorticotrofina", "LH - Hormona Luteinizante", "Ca 125", "Inmunofijacion en suero", "Inmunofijacion en orina", "Iga Secretora (saliva)", "Anti endomisio IgA", "ENA (LA)", "ENA (RNP)", "ENA (RO)", "ENA (SM)", "Artitest", "Anti DNA - Antidesixirribonucleasa - ADNEASA", "Receptor de TSH - TRABS - TRAB", "Cadena Liviana Kappa y Lambda Urinaria", "Proteinuria", "Uroproteinograma", "Cadena Liviana Kappa y Lambda Serica", "Microglobulina Beta 2", "PCR Ultrasensible", "Acido Folico", "VDRL", "Brucelosis IgG", "Brucelosis IgM", "Peptido citrulinado", "Testosterona Biodisponible", "Anti endomisio IgG", "Anti Transglutaminasa IgG", "Cadena Liviana Libre Kappa", "Cadena Liviana Libre Lambda", "Acilcarnitina", "Antinucleares", "Centromero", "Sclerodermia 70", "PRO BNP", "Troponina Us.", "Anti Trombina", "Factor V Leiden", "Homocisteina", "Ca 15/3", "Testosterona Total", "Testosterona Libre", "Exudado - Esputo", "Cromogranina A", "Beta Cross Laps", "Curva de glucosa", "LDH - Lacticodehidrogenasa", "PCR - Proteina C Reactiva", "Ac. Anti Citrulina", "Fibrinogeno", "Herpes simplex I IgG", "Herpes simplex II IgG", "IgA", "IgG", "IgM", "Micologico - Uña de pie", "Clearence de creatinina", "Carga Viral HbV", "Aldosterona", "C4 - Complemento", "Ag. Carcinoembrionario (CEA)", "Globulina ligadora de androgenos y estrogenos (GLAE / SHBG)", "Parathormona", "Jak 2 V617F", "Eritropoyetina", "Micologia Esputo", "Basiloscopia directa 2", "Basiloscopia directa 3", "Basiloscopia directa y cultiv", "Proteina C biologica", "Proteina S", "Fosfolipidos IgG", "Fosfolipidos IgM", "Ac. Anti Anca (ANCA P - ANCA C)", "Acido Hidroxi 5", "Microalbuminuria (24hs)", "Insulina Basal", "Factor Reumatoideo (ARTRITEST)", "Albumina serica", "LIPOPROTEINA LPA", "CADENA LIVIANA KAPPA", "CADENA LAMBDA", "CHAGAS POR INMUNOFLUORESCENCIA", "FOSFATEMIA", "PROTEINURIA", "MICROALBUMINURIA (MAO)", "ACIDO URICO/ URICEMIA", "ZONULINA", "CORTISOL EN SALIVA", "ANA (ANTINUCLEARES)", "ASMA ( ANTI MUSCULO LISO)", "AMA (ANTI MITOCONDRIAL)", "CITOMEGALOVIRUS IGG", "CITOMEGALOVIRUS IGM", "PROTEINOGRAMA", "DHEA (Dehidroepiandrosterona)", "INDICE DE HOMA", "PROTEINAS TOTALES", "C3- Complemento", "CODIGOS DE OBSERVACIONES", "INDICE DE CHRISTENSEN (CUANDO ES CALCIO URINARIO)", "PSA ACOMPLEJADO", "ACIDO LACTICO", "AMONEMIA", "AELO (ANTIESTREPTOLISINA)", "DHEAS", "CARGA VIRAL (HIV CV)", "COPROCULTIVO"
];

const codeSistemaList = [
"1687", "9999", "404", "406", "3043", "3070", "9001", "877", "3034", "3033", "3055", "3036", "3030", "9000", "18", "47", "3016", "414", "1746", "1007", "9994", "2866", "1163", "1070", "719", "1535", "833", "5756", "1115", "290", "12", "736", "430", "2958 - 1099", "189", "1860", "105-35-711", "3042", "1776", "1606", "1605", "1201", "1607", "3041", "1608", "1610", "1640", "1627", "1626", "3046", "3047", "3014", "2303", "1401", "1017", "1018", "2000", "9995", "404", "406", "3029", "3032", "190", "6111", "1631", "1630", "3017", "3049", "2758", "490", "1000", "1015", "1417", "1418", "1935", "2053", "939", "2938", "938", "937", "982", "199", "935", "818", "1939", "1937", "1721", "3549", "6", "3057", "3000", "5350", "5353", "1537", "1423", "1699", "1697", "1698", "1696", "598", "48", "4865", "131", "767", ".", "1155", "1850", "8623", "4500", "933", "1494", "2494", "4033", "2630", "1422", "1016", "1402", "1403", ".", "56", "3022", "1156", "7071", "4003", "58", "3056", "500", "1052", "4863", "3026", "309 - 35 - 102", "200", "115/ 879", "413", "594", "761", "1601", "2346", "1061", "1064", "537", "540", "541", "1889", "193", "1701", "19", "1059", "144", "8995", "739", "353", "4502", "667", "1020", "1055", "102", "1408", "1411", "1414", "1415", "5003", "3015", "1661", "543", "598", "762", "1618", "1402", "1403", "243", "362", "767", "661", "904", "940", ".", "56", "42", "55", "1075", "1074", "764", "362", ".", "3543", "763", "1058", "1059", "99-94", "9996", "1056", "592", "31", "51", "3017", "2009", "."
];

async function seed() {
    try {
        console.log("Seeding system_codes...");
        for (let i = 0; i < analysisList.length; i++) {
            const analisis = analysisList[i];
            const codigo_sistema = codeSistemaList[i] || "";
            let codigo_nbu = "";
            
            // Special case for Beta Cross Laps
            if (analisis === "Beta Cross Laps") {
                codigo_nbu = "Preguntarle a ricci silo mandan a manlab o gornitz";
            }
            
            await pool.query(
                "INSERT INTO system_codes (analisis, codigo_sistema, codigo_nbu) VALUES ($1, $2, $3) ON CONFLICT (analisis) DO UPDATE SET codigo_sistema = EXCLUDED.codigo_sistema, codigo_nbu = EXCLUDED.codigo_nbu",
                [analisis, codigo_sistema, codigo_nbu]
            );
        }
        
        console.log("Seeding billing_prices (Analysis list only)...");
        for (const analisis of analysisList) {
             await pool.query(
                "INSERT INTO billing_prices (analisis) VALUES ($1) ON CONFLICT (analisis) DO NOTHING",
                [analisis]
            );
        }

        console.log("Seeding successful");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
