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

const analisis = [
"ACIDO 5 HIDROXI", "ACIDO FOLICO", "ACTH (HORMONA ADRENOCORTICOTROFA)", "ADRENALINA EN SANGRE", "ADRENALINA EN ORINA", "ALDOSTERONA", "ALFA FETO PROTEINA", "ALTERACION 17 P53", "ALTERACION 17 P53 + 5Q+ 7Q", "ALTERACION 5Q - FISH", "ALTERACION 7Q - FISH", "ANTI CUERPO ANTIMUSCULO LISO", "ANTI CUERPO ANTINUCLEAR FAN", "ANTI DNA", "ANTI LA (LA/SSB)", "ANTI M2 (ANTI MITOCRONDRIALES)", "ANTI RO (LA/SSB)", "ANTI TRIPSINA 1 (SANGRE)", "ANTICOAGULANTE LUPICO", "ANTIGENO PROSTATICO", "ANTITROMBINA III FUNCIONAL", "BETA 2 GLICOPROTEINAS IGM", "BETA 2 GLICOPROTEINAS IGG", "BETA CROSS LAPS", "CA 125", "CA 19.9", "CADENA LIVIANA KAPPA Y LAMBDA SANGRE", "CADENA LIVIANA KAPPA Y LAMBDA ORINA", "CARDIOLIPINAS IGG", "CARDIOLIPINAS IGM", "CARIOTIPO - MEDULA OSEA", "CARIOTIPO - SANGRE", "CD4 CD8", "CEA", "CHAGAS", "CITOMEGALOVIRUS IGG", "CITOMEGALOVIRUS IGM", "CITOPLASMA DE NEUTR (ANCA C)", "CITOPLASMA DE NEUTR (ANCA P)", "CITRATURIA", "COMPLEMENTO C3", "COMPLEMENTO C4", "COOMBS DIRECTA", "COPROCULTIVO", "CORTISOL URINARIO", "CRIOGLOBULINA", "CROMOGRANINA A", "CROMOSOMA ALTERACION TRISOMIA 1", "DOPAMINA URINARIA", "EMR", "ENA RNP (ANTI RNP)", "ENA SM (ANTI. SM)", "ERITROPOYETINA", "F ACTINA", "FACTOR REUMATOIDEO", "FACTOR V LEIDEN", "FERRITINA", "FOSFOLIPIDOS IGG", "FOSFOLIPIDOS IGM", "GLOBULINA TRANSPORTADORA DE TIROXINA - TBG", "HEMOGLOBINA GLICOSILADA", "HEPATITIS B - SUPERFICIE ANTIGENO", "HEPATITIS B (HBC IGG)", "HEPATITIS B CORE (HBC IGM)", "HEPATITIS C (HCV IGG)", "HEPATITIS C (IGM)", "HIV", "HOMOCISTEINA", "IGA", "IGG", "IGM", "INMUNOFENOTIPO", "INMUNOFIJACION ORINA", "INMUNOFIJACION SERICA", "JAK 2 (V617F)", "MICROGLOBULINA BETA 2", "MONITOREO DE FARMACOS", "NORADRENALINA EN SANGRE", "NORADRENALINA EN ORINA", "PANEL HEPATICO (SP100- LKM 1 - GP 210 - LC 1 - SLA)", "PANEL MIELOIDE", "PARATHORMONA", "PCR (PROTEINA C REACTIVA)", "PRO BNP", "PROTEINA C FUNCIONAL", "PROTEINA S LIBRE", "RECEPTOR SOLUBLE DE TRANSFERRINA", "RELACION ALDOSTERONA - RENINA", "RENINA", "SEROTONINA EN SANGRE", "SEROTONINA EN ORINA", "SINDROME LINFOPROLI", "SINDROME MIELOPROLI", "SOMATOMEDINA C IGFB1", "SOMATOTROFINA", "TESTOSTERONA BIODISPONIBLE", "TESTOSTERONA TOTAL", "RECEPTOR DE TSH - TRABS", "TRASLOCACION CUANTI (190 - 210)", "TRASLOCACION CUALI (190-210)", "VITAMINA B12", "VITAMINA D", "PAPP - A", "BETA LIBRE HCG", "PEPTIDO CIRTULINADO", "ALFA GALACTOSIDASA", "PANEL GANGLISIDOSIS", "NEUMOCOCO AC.", "FACTOR INTRINSECO AC. ANTI", "MUCOSA GASTRICA, AC. ANTI", "CROMOSOMA - IGVH", "CALPROTECTINA", "TIROGLOBULINA", "MICOLOGICO UÑAS", "PROTROMBINA 210", "SCLERODERMIA - SCL 70", "CA 15.3", "CADENAS PESADAS EN SANGRE", "CADENAS PESADAS EN ORINA", "ACIDO URICO URINARIO", "CADENA LIVIANA KAPPA LIBRE", "MIELOPEROXIDADA", "PROTEINASA 3", "PYLORI MF", "CROSS MATCH PANEL", "CROSS MATCH DONANTE", "HLA A MOLECULAR", "HLA B MOLECULAR", "HLA DR CITROMETRIA", "AC. ANTI PLAQUETARIA", "CADENA LIVIANA KAPPA SUERO", "CADENA LIVIANA LAMBDA ORINA", "CADENA LIVIANA LIBRE LAMBDA SUERO", "CADENA LIVIANA KAPPA LIBRE ORINA"
];

const cibic = [
"$3.339,00", "$4.171,00", "$16.310,00", "$16.310,00", "$9.109,00", "$3.006,00", "$257.898,00", "-", "-", "-", "$4.184,00", "$7.247,00", "$8.518,00", "$12.777,00", "$16.701,00", "$12.777,00", "$2.940,00", "$10.792,00", "$1.967,00", "$20.251,00", "$11.768,00", "$11.768,00", "$16.323,00", "$4.791,00", "$4.791,00", "$40.534,00", "$36.661,00", "$8.185,00", "$8.185,00", "$113.898,00", "$83.235,00", "17.269 (C/U)", "$2.780,00", "-", "$5.288,00", "$5.728,00", "$16.397,00", "$16.397,00", "$8.662,00", "$2.061,00", "$2.061,00", "$6.240,00", "-", "$3.079,00", "$1.536,00", "$74.903,00", "-", "$16.310,00", "$525.252,00", "$12.777,00", "$12.777,00", "$14.306,00", "-", "$1.689,00", "$34.063,00", "$2.280,00", "$12.570,00", "$11.918,00", "-", "$2.527,00", "-", "-", "-", "-", "-", "$2.542,00", "$8.766,00", "$1.565,00", "$1.674,00", "$1.674,00", "-", "$56.858,00", "$53.190,00", "$73.245,00", "$6.410,00", "-", "$16.310,00", "$16.310,00", "$61.967,00", "$1.259.832,00", "$3.810,00", "$1.535,00", "$40.380,00", "$21.804,00", "$38.959,00", "-", "-", "$19.441,00", "$12.742,00", "$12.742,00", "-", "-", "$11.483,00", "$3.696,00", "$7.207,00", "$2.164,00", "$14.231,00", "-", "-", "$3.869,00", "$5.685,00", "$14.637,00", "$2.422,00", "$17.191,00", "-", "$584.616,00", "-", "$16.788,00", "$8.049,00", "$764.052,00", "$37.599,00", "$5.502,00", "-", "$34.063,00", "$12.777,00", "$4.791,00", "-", "-", "-", "$115.379,00", "$16.397,00", "$16.397,00", "$30.034,00", "-", "-", "$110.849,00", "$110.849,00", "$23.210,00", "$44.807,00", "$41.953,00", "$37.944,00", "$118.840,00", "-"
];

const gornitz = [
"$14.224,85", "$3.798,53", "$3.399,17", "$50.500,00", "$50.500,00", "$32.772,03", "$2.155,83", "-", "-", "-", "-", "$2.669,21", "$5.379,57", "$2.873,56", "$11.606,81", "$17.553,33", "IGUAL LA", "$7.021,81", "$12.319,05", "$2.589,87", "$11.854,01", "$11.291,92", "$11.291,92", "$9.810,81", "3.701,61", "$3.701,61", "$24.938,72", "-", "$3.839,59", "$3.839,59", "-", "-", "19982,95 C/U", "$2.748,48", "$1.495,83", "$2.977,55", "$3.637,09", "$11.937,14", "-", "$13.854,85", "$1.439,09", "$1.439,09", "$1.107,69", "$3.232,81", "$2.562,90", "$2.207,01", "$89.963,49", "-", "$25.250,00", "-", "IGUAL LA", "IGUAL LA", "$14.087,50", "-", "$702,79", "$35.929,54", "$2.343,96", "$5.819,86", "$5.819,86", "-", "$2.014,95", "$2.669,21", "-", "$4.743,36", "$3.513,25", "-", "$2.082,43", "$10.507,77", "$1.459,69", "-", "-", "-", "$60.781,21", "$60.781,21", "$109.240,11", "$5.096,93", "-", "$50.500,00", "$50.500,00", "$79.027,70", "-", "$2.965,69", "$806,39", "$47.416,49", "$18.958,21", "$47.416,49", "$21.412,94", "$58.459,59", "$58.459,59", "$25.250,00", "$25.250,00", "-", "-", "$16.332,42", "$4.138,58", "$7.139,44", "$2.189,35", "$17.811,78", "205308,56 (C/U)", "84259,94 (C/U)", "$3.064,88", "$7.634,00", "-", "$2.082,43", "$11.180,17", "-", "$637.322,72", "$117.825,21", "$28.086,17", "$3.966,10", "$645.773,31", "$48.470,34", "$5.982,34", "-", "$38.187,29", "$4.684,28", "$3.575,57", "-", "-", "-", "$214.750,04", "$20.362,71", "$20.362,71", "-", "-", "-", "$105.370,17", "$121.244,97", "$118.541,59", "$162.006,70", "$25.562,19", "-", "$220.118,79", "-"
];

const fpm = [
"$13.587,11", "$6.605,79", "$9.030,24", "$10.242,54", "$10.242,54", "$13.012,28", "$5.344,02", "$517.303,00", "-", "-", "-", "$7.154,85", "$4.444,35", "$9.115,67", "$8.691,51", "$20.620,66", "$9.324,49", "-", "$20.155,68", "$3.749,03", "$16.336,71", "$16.289,06", "$16.289,06", "$14.560,04", "$8.863,04", "$8.863,04", "80.433 (c/u)", "-", "7016.07", "7016.07", "-", "$29.119,52", "$5.344,02", "-", "$7.506,94", "$7.553,27", "$7.840,88", "$7.840,88", "$8.248,30", "$3.168,78", "$3.168,78", "$3.468,46", "$6.912,95", "$3.397,30", "$1.232,91", "$83.281,08", "-", "$8.699,51", "-", "$8.673,94", "$8.673,94", "$11.130,00", "-", "$1.600,70", "$37.830,43", "$4.410,14", "$11.676,92", "$11.676,92", "$19.632,48", "$3.048,91", "$8.540,15", "$7.839,52", "$14.642,70", "$7.939,96", "-", "6222,71", "$14.085,01", "$3.002,25", "$2.392,87", "$2.392,87", "-", "$63.587,15", "$63.587,15", "$62.727,00", "$7.941,45", "-", "$8.285,16", "$8.285,16", "-", "-", "$4.633,50", "$1.813,49", "$38.441,51", "$20.878,76", "$20.878,76", "-", "-", "$12.088,12", "$12.397,33", "$12.607,94", "-", "-", "$18.640,18", "$9.394,27", "$10.772,46", "$3.521,17", "$18.880,05", "-", "$146.218,80", "$5.180,00", "$43.751,01", "$34.186,28", "$33.184,59", "$18.418,17", "-", "$50.636,26", "$43.289,80", "$29.412,37", "-", "$753.632,03", "$38.689,50", "$7.007,28", "-", "-", "$10.842,37", "$7.776,57", "-", "-", "-", "$80.443,00", "$22.315,27", "$18.595,92", "-", "$180.550,00", "$18.000,00", "$104.075,00", "$104.075,00", "$74.221,08", "-", "-", "-", "$86.472,22", "$86.472,22"
];

const manlab = [
"$16.442,90", "$1.489,67", "$2.973,23", "-", "-", "$14.676,87", "$1.488,93", "$179.325,56", "-", "-", "-", "$5.333,27", "$2.474,16", "$9.200,37", "$5.854,55", "$13.572,55", "$5.854,55", "$2.385,65", "$18.550,04", "$1.341,55", "$7.221,23", "$9.694,72", "$9.694,72", "$6.550,11", "$1.757,18", "$1.674,31", "$20.947,00", "-", "$5.218,16", "$5.218,16", "-", "-", "15782,47 (C/U)", "$1.526,15", "-", "$2.627,82", "$3.758,43", "$20.071,14", "$20.071,14", "$3.444,59", "$1.102,42", "$1.102,42", "$3.223,52", "-", "$1.592,36", "$2.018,23", "58814.07", "-", "$9039.86", "-", "$6541.36", "$15988.46", "6384.45", "-", "$669,55", "$26551.83", "$1327.72", "$7030.93", "$7030.93", "-", "$1147.49", "$1160.16", "-", "$2326.09", "$2.516,00", "-", "$1303.84", "$4582.67", "$859.66", "$687.72", "$687.72", "-", "$61.163,37", "$48.935,87", "$57.990,84", "$2597.89", "-", "-", "-", "$76.363,45", "-", "$1755,06", "$800.18", "$35231.13", "-", "$15727.12", "$33020.61", "$26585.33", "$10626.57", "$20224.76", "$25387.70", "-", "-", "$6112.64", "$3628.97", "$2980.82", "$851.01", "$9814.30", "-", "-", "$1619.82", "$5833.81", "$6.708,75", "$4.470,90", "$14.907,95", "$348.731,99", "$112.804,26", "$92.193,68", "$15.513,15", "$5.333,27", "$699.978,91", "$30.542,33", "$3.280,51", "-", "$25.904,22", "$4.298,27", "$1.671,54", "$20.947,00", "$20.947,00", "-", "$95.710,90", "$9.694,72", "$9.694,72", "-", "$243.986,20", "$100.747,34", "$73.620,17", "$73.620,17", "$73.620,17", "-", "$22.425,39", "$22.425,39", "$102.465,96", "$102.465,96"
];

async function seed() {
    try {
        console.log("Seeding billing_prices with detailed data...");
        for (let i = 0; i < analisis.length; i++) {
            await pool.query(
                `INSERT INTO billing_prices (analisis, cibic, gornitz, fpm, manlab) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (analisis) 
                 DO UPDATE SET 
                    cibic = EXCLUDED.cibic, 
                    gornitz = EXCLUDED.gornitz, 
                    fpm = EXCLUDED.fpm, 
                    manlab = EXCLUDED.manlab`,
                [analisis[i], cibic[i], gornitz[i], fpm[i], manlab[i]]
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
