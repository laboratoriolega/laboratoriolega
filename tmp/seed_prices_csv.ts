import { Pool } from "pg";
import fs from "fs";
import path from "path";

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

async function seed() {
    try {
        const csvPath = path.join(process.cwd(), "public", "PRECIOS FACTURACION internos   - PRECIOS .csv");
        const content = fs.readFileSync(csvPath, "utf8");
        const lines = content.split("\n");

        console.log("Clearing billing_prices table...");
        await pool.query("DELETE FROM billing_prices");

        console.log("Seeding from CSV...");
        
        // Skip header lines (1 and 2)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(",,,,,")) continue;

            // Handle quoted CSV cells (e.g., " $14.224,85")
            const parts: string[] = [];
            let current = "";
            let inQuotes = false;
            for (let char of line) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            parts.push(current.trim());

            if (parts.length < 5) continue;

            const analisis = parts[0].trim().replace(/^"(.*)"$/, '$1').trim();
            if (!analisis || analisis === "Análisis") continue;

            const cibic = parts[1] || "";
            const gornitz = parts[2] || "";
            const fpm = parts[3] || "";
            const manlab = parts[4] || "";
            const lerda = parts[5] || "";

            await pool.query(
                `INSERT INTO billing_prices (analisis, cibic, gornitz, fpm, manlab, lerda) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [analisis, cibic, gornitz, fpm, manlab, lerda]
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
