import pg from 'pg';
const { Client } = pg;

const DB_URL = "postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function migrateTZ() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    console.log("Connected to database for timezone migration.");

    // Migration for appointments table
    console.log("Migrating appointments.appointment_date to TIMESTAMPTZ...");
    await client.query(`
      ALTER TABLE appointments 
      ALTER COLUMN appointment_date 
      TYPE TIMESTAMPTZ 
      USING appointment_date AT TIME ZONE 'America/Argentina/Buenos_Aires'
    `);
    console.log("Appointments table migrated successfully.");

    // Check if audit_log exists and migrate its timestamp
    const tableCheck = await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log'");
    if (tableCheck.rowCount > 0) {
      console.log("Migrating audit_log.action_time to TIMESTAMPTZ...");
      await client.query(`
        ALTER TABLE audit_log 
        ALTER COLUMN action_time 
        TYPE TIMESTAMPTZ 
        USING action_time AT TIME ZONE 'America/Argentina/Buenos_Aires'
      `);
      console.log("Audit log migrated successfully.");
    }

    console.log("TIMEZONE MIGRATION COMPLETED.");

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrateTZ();
