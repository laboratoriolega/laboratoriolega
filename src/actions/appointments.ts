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
             json_agg(json_build_object('id', ad.id, 'url', ad.document_url, 'filename', ad.filename)) 
             FILTER (WHERE ad.id IS NOT NULL) as documents,
             p.name, p.dni, p.health_insurance 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN appointment_documents ad ON a.id = ad.appointment_id
      GROUP BY a.id, p.id
      ORDER BY a.appointment_date ASC
    `);
    return { 
      data: res.rows.filter(row => row && row.id).map(row => ({
        ...row,
        appointment_date: row.appointment_date ? new Date(row.appointment_date).toISOString() : null,
        status: row.status || 'AGENDADO',
        documents: row.documents || [],
        has_document: (row.documents && row.documents.length > 0)
      })), 
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return { data: null, error: error.message };
  }
}

export async function deleteDocument(docId: number) {
  try {
    await pool.query('DELETE FROM appointment_documents WHERE id = $1', [docId]);
    revalidatePath("/");
    revalidatePath("/calendario");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
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
    const files = formData.getAll("document") as File[];

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

    // UPSERT patient based on DNI and update their details to ensure synchronization
    const patientRes = await client.query(
      `INSERT INTO patients (name, dni, email, phone, health_insurance) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (dni) 
       DO UPDATE SET 
         name = EXCLUDED.name, 
         email = EXCLUDED.email, 
         phone = EXCLUDED.phone, 
         health_insurance = EXCLUDED.health_insurance 
       RETURNING id`,
      [name, dni, email, phone, health_insurance]
    );
    const patientId = patientRes.rows[0].id;

    // Insert Appointment
    const aptRes = await client.query(
      'INSERT INTO appointments (patient_id, appointment_date, analysis_type, aire_test_type, observations) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [patientId, appointment_date, analysis_type, aire_test_type, observations]
    );
    const appointmentId = aptRes.rows[0].id;

    // Upload to Vercel Blob and Insert to documents table
    for (const file of files) {
      if (file && file.size > 0) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} es demasiado grande (Máximo 10MB).`);
        }
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `pedidos/${Date.now()}-${dni}-${Math.random().toString(36).substring(7)}.${ext}`;
        const blob = await put(filename, file, { access: 'private' });
        
        await client.query(
          'INSERT INTO appointment_documents (appointment_id, document_url, filename) VALUES ($1, $2, $3)',
          [appointmentId, blob.url, file.name]
        );
      }
    }

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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const id = formData.get("id");
    const appointment_date = formData.get("appointment_date") as string;
    const analysis_type = formData.get("analysis_type") as string;
    const aire_test_type = formData.get("aire_test_type") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const observations = formData.get("observations") as string;
    const files = formData.getAll("document") as File[];

    // Check limit if changing type to Test de aire or changing date for an Test de aire appointment
    if (analysis_type === 'Test de aire') {
      const targetDateStr = appointment_date.split('T')[0];
      const countRes = await client.query(
        "SELECT COUNT(*) FROM appointments WHERE analysis_type = 'Test de aire' AND DATE(appointment_date) = $1 AND id != $2",
        [targetDateStr, id]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de 'Test de aire' por día.");
      }
    }

    await client.query(
      `UPDATE appointments a
       SET appointment_date = $1, analysis_type = $2, aire_test_type = $3, observations = $4
       FROM patients p
       WHERE a.patient_id = p.id AND a.id = $5`,
      [appointment_date, analysis_type, aire_test_type, observations, id]
    );

    await client.query(
      `UPDATE patients SET health_insurance = $1 WHERE id = (SELECT patient_id FROM appointments WHERE id = $2)`,
      [health_insurance, id]
    );

    // Get patient DNI for filename
    const patientRes = await client.query('SELECT dni FROM patients WHERE id = (SELECT patient_id FROM appointments WHERE id = $1)', [id]);
    const dni = patientRes.rows[0].dni;

    // Upload new files
    for (const file of files) {
      if (file && file.size > 0) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} es demasiado grande (Máximo 10MB).`);
        }
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `pedidos/${Date.now()}-${dni}-${Math.random().toString(36).substring(7)}.${ext}`;
        const blob = await put(filename, file, { access: 'private' });
        
        await client.query(
          'INSERT INTO appointment_documents (appointment_id, document_url, filename) VALUES ($1, $2, $3)',
          [id, blob.url, file.name]
        );
      }
    }

    await client.query('COMMIT');
    await logAction("UPDATE_APPOINTMENT", { appointment_id: id, analysis_type });

    revalidatePath("/");
    revalidatePath("/calendario");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Update appointment error:", error);
    return { error: error.message };
  } finally {
    client.release();
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

export async function deleteAppointment(id: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autorizado");

    // Get info for logging before deleting
    const current = await pool.query("SELECT p.name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1", [id]);
    const name = current.rows[0]?.name || "Desconocido";

    await pool.query("DELETE FROM appointment_documents WHERE appointment_id = $1", [id]);
    await pool.query("DELETE FROM appointments WHERE id = $1", [id]);

    await logAction("DELETE_APPOINTMENT", { appointment_id: id, patient_name: name });

    revalidatePath("/calendario");
    revalidatePath("/");
    revalidatePath("/turnos-lista");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Delete appointment error:", error);
    return { error: error.message };
  }
}
export async function updateAppointmentStatus(id: string, status: string, reason?: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autorizado");

    if (reason) {
      await pool.query(
        "UPDATE appointments SET status = $1, observations = COALESCE(observations, '') || $2 WHERE id = $3",
        [status, `\n[${status} - ${format(new Date(), "dd/MM")}] Motivo: ${reason}`, id]
      );
    } else {
      await pool.query("UPDATE appointments SET status = $1 WHERE id = $2", [status, id]);
    }

    await logAction("UPDATE_APPOINTMENT_STATUS", { 
      appointment_id: id, 
      new_status: status,
      reason: reason || null
    });

    revalidatePath("/");
    revalidatePath("/calendario");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Update status error:", error);
    return { error: error.message };
  }
}
