"use server";

import pool from '@/lib/db';

export async function getAppointments() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.appointment_date, a.status, a.analysis_type, a.observations,
             p.name, p.dni, p.health_insurance 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      ORDER BY a.appointment_date ASC
    `);
    return { data: res.rows, error: null };
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return { data: null, error: error.message };
  }
}

export async function createAppointment(data: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // UPSERT patient based on DNI
    let patientId;
    const existingPatient = await client.query('SELECT id FROM patients WHERE dni = $1', [data.dni]);
    if (existingPatient.rows.length > 0) {
      patientId = existingPatient.rows[0].id;
    } else {
      const newPatient = await client.query(
        'INSERT INTO patients (name, dni, email, health_insurance) VALUES ($1, $2, $3, $4) RETURNING id',
        [data.name, data.dni, data.email, data.health_insurance]
      );
      patientId = newPatient.rows[0].id;
    }

    // Insert Appointment
    await client.query(
      'INSERT INTO appointments (patient_id, appointment_date, analysis_type, observations) VALUES ($1, $2, $3, $4)',
      [patientId, data.appointment_date, data.analysis_type, data.observations]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error creating appointment:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
}
