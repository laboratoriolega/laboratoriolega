import pg from 'pg';
const { Pool } = pg;

const TARGET_URL = 'postgresql://neondb_owner:npg_xmwSld39Oiac@ep-orange-sound-a421m5w3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function prepare() {
  const pool = new Pool({ connectionString: TARGET_URL });

  try {
    console.log("Preparing target database schema (V3 - Clean Recreate)...");

    const tables = [
      'audit_logs',
      'appointment_documents',
      'appointments',
      'patients',
      'users',
      'billing_prices',
      'pendientes',
      'system_codes'
    ];

    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    console.log("Existing tables dropped.");

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        full_name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        dni VARCHAR(50) UNIQUE NOT NULL,
        birth_date DATE,
        email VARCHAR(255),
        health_insurance VARCHAR(255),
        phone VARCHAR(50)
      );
    `);

    await pool.query(`
      CREATE TABLE appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        appointment_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'AGENDADO',
        analysis_type VARCHAR(255) NOT NULL,
        aire_test_type VARCHAR(255),
        observations TEXT,
        evolution_notes TEXT,
        indications_sent BOOLEAN DEFAULT FALSE,
        is_domicilio BOOLEAN DEFAULT FALSE,
        domicilio_address TEXT,
        google_maps_link TEXT,
        document_url TEXT,
        document_base64 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE appointment_documents (
        id SERIAL PRIMARY KEY,
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        document_url TEXT NOT NULL,
        filename TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE billing_prices (
        id SERIAL PRIMARY KEY,
        analisis TEXT,
        cibic VARCHAR(255),
        gornitz VARCHAR(255),
        fpm VARCHAR(255),
        manlab VARCHAR(255),
        lerda VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE pendientes (
        id SERIAL PRIMARY KEY,
        fecha DATE,
        paciente TEXT,
        pendiente TEXT,
        detalle TEXT,
        seguimiento TEXT,
        observaciones TEXT,
        month_group TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE system_codes (
        id SERIAL PRIMARY KEY,
        analisis TEXT,
        codigo_sistema TEXT,
        codigo_nbu TEXT,
        ub TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Target database schema is ready!");

  } catch (error) {
    console.error("Error preparing target DB:", error);
  } finally {
    await pool.end();
  }
}

prepare();
