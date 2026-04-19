"use server";

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { logAction } from './audit';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';

export async function getAppointments() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.appointment_date, a.status, a.analysis_type, a.aire_test_type, a.observations, a.evolution_notes,
             a.document_url,
             CASE WHEN (a.document_url IS NOT NULL OR a.document_base64 IS NOT NULL) THEN true ELSE false END as has_document,
             p.name, p.dni, p.health_insurance 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      ORDER BY a.appointment_date ASC
    `);
    return { 
      data: res.rows.map(row => ({
        ...row,
        appointment_date: row.appointment_date ? new Date(row.appointment_date).toISOString() : null
      })), 
      error: null 
    };
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
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const appointment_date = formData.get("appointment_date") as string;
    const analysis_type = formData.get("analysis_type") as string;
    const aire_test_type = formData.get("aire_test_type") as string;
    const observations = formData.get("observations") as string;
    const file = formData.get("document") as File;

    // Turn limit for 'Test de aire' (Max 4 per day)
    if (analysis_type === 'Test de aire') {
      const targetDateStr = appointment_date.split('T')[0];
      const countRes = await client.query(
        "SELECT COUNT(*) FROM appointments WHERE analysis_type = 'Test de aire' AND DATE(appointment_date) = $1",
        [targetDateStr]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de 'Test de aire' por día.");
      }
    }

    // Upload to Vercel Blob (NOT to Postgres)
    let document_url = null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("El archivo es demasiado grande (Máximo 10MB).");
      }
      const ext = file.name.split('.').pop() || 'bin';
      const filename = `pedidos/${Date.now()}-${dni}.${ext}`;
      const blob = await put(filename, file, { access: 'private' });
      document_url = blob.url;
    }

    // UPSERT patient based on DNI
    let patientId;
    const existingPatient = await client.query('SELECT id FROM patients WHERE dni = $1', [dni]);
    if (existingPatient.rows.length > 0) {
      patientId = existingPatient.rows[0].id;
    } else {
      const newPatient = await client.query(
        'INSERT INTO patients (name, dni, email, phone, health_insurance) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, dni, email, phone, health_insurance]
      );
      patientId = newPatient.rows[0].id;
    }

    // Insert Appointment - store URL, not base64
    await client.query(
      'INSERT INTO appointments (patient_id, appointment_date, analysis_type, aire_test_type, observations, document_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [patientId, appointment_date, analysis_type, aire_test_type, observations, document_url]
    );

    await client.query('COMMIT');
    
    await logAction("CREATE_APPOINTMENT", { patient_name: name, dni, analysis_type });

    revalidatePath("/");
    revalidatePath("/calendario");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error creating appointment:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
}

export async function updateEvolution(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  const evolution_notes = formData.get("evolution_notes");

  try {
    await pool.query(
      'UPDATE appointments SET status = $1, evolution_notes = $2 WHERE id = $3',
      [status, evolution_notes, id]
    );

    await logAction("UPDATE_EVOLUTION", { appointment_id: id, new_status: status });

    revalidatePath("/calendario");
    revalidatePath("/");
    revalidatePath("/pacientes", "layout");
    
    return { success: true };
  } catch (error: any) {
    console.error("Evolution error:", error);
    return { error: error.message };
  }
}

export async function updateAppointment(formData: FormData) {
  try {
    const id = formData.get("id");
    const appointment_date = formData.get("appointment_date") as string;
    const analysis_type = formData.get("analysis_type") as string;
    const aire_test_type = formData.get("aire_test_type") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const observations = formData.get("observations") as string;

    // Check limit if changing type to Test de aire or changing date for an Test de aire appointment
    if (analysis_type === 'Test de aire') {
      const targetDateStr = appointment_date.split('T')[0];
      const countRes = await pool.query(
        "SELECT COUNT(*) FROM appointments WHERE analysis_type = 'Test de aire' AND DATE(appointment_date) = $1 AND id != $2",
        [targetDateStr, id]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de 'Test de aire' por día.");
      }
    }

    await pool.query(
      `UPDATE appointments a
       SET appointment_date = $1, analysis_type = $2, aire_test_type = $3, observations = $4
       FROM patients p
       WHERE a.patient_id = p.id AND a.id = $5`,
      [appointment_date, analysis_type, aire_test_type, observations, id]
    );

    // Also update health_insurance in patients table if needed (simplified: just do it)
    await pool.query(
      `UPDATE patients SET health_insurance = $1 WHERE id = (SELECT patient_id FROM appointments WHERE id = $2)`,
      [health_insurance, id]
    );

    await logAction("UPDATE_APPOINTMENT", { appointment_id: id, analysis_type });

    revalidatePath("/");
    revalidatePath("/calendario");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Update appointment error:", error);
  }
}

export async function moveAppointment(appointmentId: string, newDate: string, reason: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autorizado");

    // Get current data for logging and logic
    const current = await pool.query("SELECT p.name, a.analysis_type FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1", [appointmentId]);
    const apt = current.rows[0];

    // Check limit if moving a Test de aire
    if (apt?.analysis_type === 'Test de aire') {
      const targetDateStr = newDate.split('T')[0];
      const countRes = await pool.query(
        "SELECT COUNT(*) FROM appointments WHERE analysis_type = 'Test de aire' AND DATE(appointment_date) = $1 AND id != $2",
        [targetDateStr, appointmentId]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de 'Test de aire' por día.");
      }
    }

    await pool.query(
      "UPDATE appointments SET appointment_date = $1, evolution_notes = COALESCE(evolution_notes, '') || '\n' || $2 WHERE id = $3",
      [newDate, `[REPROGRAMACIÓN ${format(new Date(), "dd/MM")}] Motivo: ${reason}`, appointmentId]
    );

    await logAction("MOVE_APPOINTMENT", { 
      appointment_id: appointmentId, 
      patient_name: apt?.name, 
      new_date: newDate,
      reason 
    });

    revalidatePath("/calendario");
    revalidatePath("/");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Move appointment error:", error);
    return { error: error.message };
  }
}
