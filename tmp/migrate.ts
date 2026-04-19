import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Manually load .env.local for standalone execution
let databaseUrl = "";
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    env.split("\n").forEach(line => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^"(.*)"$/, '$1');
        if (key === "DATABASE_URL") databaseUrl = value;
      }
    });
  }
} catch (e) {
  console.error("Error loading .env.local:", e);
}

if (!databaseUrl) {
    console.error("DATABASE_URL not found in .env.local");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function migrate() {
    try {
        const sqlPath = path.join(process.cwd(), "migrations/1713550000000_add_listados_tables.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");
        
        console.log("Running SQL migration...");
        await pool.query(sql);
        console.log("Migration successful");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
