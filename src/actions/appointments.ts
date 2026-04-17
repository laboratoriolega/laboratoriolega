"use server";

import pool from '@/lib/db';

export async function getAppointments() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.appointment_date, a.status, a.analysis_type, a.observations,
             CASE WHEN a.document_base64 IS NOT NULL THEN true ELSE false END as has_document,
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

export async function createAppointment(formData: FormData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const name = formData.get("name") as string;
    const dni = formData.get("dni") as string;
    const email = formData.get("email") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const appointment_date = formData.get("appointment_date") as string;
    const analysis_type = formData.get("analysis_type") as string;
    const observations = formData.get("observations") as string;
    const file = formData.get("document") as File;

    let document_base64 = null;
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      document_base64 = Buffer.from(arrayBuffer).toString('base64');
    }

    // UPSERT patient based on DNI
    let patientId;
    const existingPatient = await client.query('SELECT id FROM patients WHERE dni = $1', [dni]);
    if (existingPatient.rows.length > 0) {
      patientId = existingPatient.rows[0].id;
    } else {
      const newPatient = await client.query(
        'INSERT INTO patients (name, dni, email, health_insurance) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, dni, email, health_insurance]
      );
      patientId = newPatient.rows[0].id;
    }

    // Insert Appointment
    await client.query(
      'INSERT INTO appointments (patient_id, appointment_date, analysis_type, observations, document_base64) VALUES ($1, $2, $3, $4, $5)',
      [patientId, appointment_date, analysis_type, observations, document_base64]
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
