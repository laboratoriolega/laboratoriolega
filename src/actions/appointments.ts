"use server";

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { logAction } from './audit';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';

export async function getTodayAppointments() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.appointment_date, a.analysis_type, p.name, p.dni, p.health_insurance, p.phone, p.email, p.birth_date, p.address
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE DATE(a.appointment_date) = CURRENT_DATE
      ORDER BY a.appointment_date ASC
    `);
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getAppointments() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.appointment_date, a.status, a.analysis_type, a.aire_test_type, a.observations, a.evolution_notes, a.is_domicilio, a.domicilio_address, a.google_maps_link,
             a.report_id, a.result_date, a.coseguro, a.particular_price, a.payment_method, a.professional_name, a.checkbox_checked,
             (
               SELECT json_agg(json_build_object('id', ad.id, 'url', ad.document_url, 'filename', ad.filename, 'analysis_id', ad.analysis_id))
               FROM appointment_documents ad
               WHERE ad.appointment_id = a.id
             ) as documents,
             (
               SELECT json_agg(json_build_object('id', aa.id, 'name', aa.analysis_name, 'subtype', aa.aire_test_subtype, 'status', aa.status))
               FROM appointment_analyses aa
               WHERE aa.appointment_id = a.id
             ) as analyses,
             p.name, p.dni, p.phone, p.health_insurance, a.indications_sent 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
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
    
    const name = (formData.get("name") as string)?.toUpperCase().trim();
    const dni = formData.get("dni") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const appointment_date = formData.get("appointment_date") as string;
    const analysis_type = formData.get("analysis_type") as string;
    const aire_test_type = formData.get("aire_test_type") as string;
    const observations = formData.get("observations") as string;
    const is_domicilio = formData.get("is_domicilio") === "true";
    const domicilio_address = formData.get("domicilio_address") as string;
    const google_maps_link = domicilio_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(domicilio_address)}` : null;
    const files = formData.getAll("document") as File[];

    // Turn limit for 'Aires' (Max 4 per day)
    const airTestNames = ['SIBO', 'LACTOSA', 'FRUCTUOSA', 'SIBO C/LACTULON', 'TEST DE AIRE', 'AIRES'];
    if (airTestNames.includes(analysis_type?.toUpperCase() || "")) {
      const targetDateStr = appointment_date.split('T')[0];
      const countRes = await client.query(
        "SELECT COUNT(*) FROM appointments WHERE UPPER(analysis_type) = ANY($1::text[]) AND DATE(appointment_date) = $2 AND (status IS NULL OR status != 'CANCELADO')",
        [airTestNames, targetDateStr]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de pruebas de aire por día.");
      }
    }

    // Find or Create patient. 
    // We search by DNI AND Name to allow multiple people to share a DNI (like a placeholder '.')
    let patientRes = await client.query(
      "SELECT id FROM patients WHERE dni = $1 AND UPPER(name) = UPPER($2)",
      [dni, name]
    );

    let patientId;
    if (patientRes.rows.length > 0) {
      patientId = patientRes.rows[0].id;
      // Update other details if changed
      await client.query(
        "UPDATE patients SET email = $1, phone = $2, health_insurance = $3 WHERE id = $4",
        [email, phone, health_insurance, patientId]
      );
    } else {
      const session = await getSession() as any;
      const creatorName = session?.full_name || session?.username || "Sistema";
      const newPatientRes = await client.query(
        "INSERT INTO patients (name, dni, email, phone, health_insurance, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [name, dni, email, phone, health_insurance, creatorName]
      );
      patientId = newPatientRes.rows[0].id;
    }

    // Insert Appointment
    const aptRes = await client.query(
      'INSERT INTO appointments (patient_id, appointment_date, analysis_type, aire_test_type, observations, is_domicilio, domicilio_address, google_maps_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [patientId, appointment_date, analysis_type, aire_test_type, observations, is_domicilio, domicilio_address, google_maps_link]
    );
    const appointmentId = aptRes.rows[0].id;

    // Insert Analyses (Multiple)
    const analysisNames = formData.getAll("analysis_name") as string[];
    const analysisSubtypes = formData.getAll("aire_test_subtype") as string[];

    if (analysisNames.length > 0) {
      for (let i = 0; i < analysisNames.length; i++) {
        await client.query(
          "INSERT INTO appointment_analyses (appointment_id, analysis_name, aire_test_subtype) VALUES ($1, $2, $3)",
          [appointmentId, analysisNames[i], analysisSubtypes[i] || null]
        );
      }
    } else {
      // Fallback to the single analysis_type if no array provided (legacy or single field)
      await client.query(
        "INSERT INTO appointment_analyses (appointment_id, analysis_name, aire_test_subtype) VALUES ($1, $2, $3)",
        [appointmentId, analysis_type, aire_test_type]
      );
    }

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
    const analysisNamesRaw = formData.getAll("analysis_name") as string[];
    const analysis_type = (formData.get("analysis_type") as string) || analysisNamesRaw[0] || null;
    const aire_test_type = (formData.get("aire_test_type") as string) || (formData.getAll("aire_test_subtype") as string[])[0] || null;
    const health_insurance = formData.get("health_insurance") as string;
    const observations = formData.get("observations") as string;
    const is_domicilio = formData.get("is_domicilio") === "true";
    const domicilio_address = formData.get("domicilio_address") as string;
    const google_maps_link = domicilio_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(domicilio_address)}` : null;
    const files = formData.getAll("document") as File[];

    // Check limit if changing type to an air test or changing date for an air test appointment
    const airTestNames = ['SIBO', 'LACTOSA', 'FRUCTUOSA', 'SIBO C/LACTULON', 'TEST DE AIRE', 'AIRES'];
    if (airTestNames.includes(analysis_type?.toUpperCase() || "")) {
      const targetDateStr = appointment_date.split('T')[0];
      const countRes = await client.query(
        "SELECT COUNT(*) FROM appointments WHERE UPPER(analysis_type) = ANY($1::text[]) AND DATE(appointment_date) = $2 AND id != $3 AND (status IS NULL OR status != 'CANCELADO')",
        [airTestNames, targetDateStr, id]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de pruebas de aire por día.");
      }
    }

    await client.query(
      `UPDATE appointments a
       SET appointment_date = $1, analysis_type = $2, aire_test_type = $3, observations = $4, is_domicilio = $5, domicilio_address = $6, google_maps_link = $7
       FROM patients p
       WHERE a.patient_id = p.id AND a.id = $8`,
      [appointment_date, analysis_type, aire_test_type, observations, is_domicilio, domicilio_address, google_maps_link, id]
    );

    // Sync Multiple Analyses
    const analysisNames = analysisNamesRaw;
    const analysisSubtypes = formData.getAll("aire_test_subtype") as string[];

    if (analysisNames.length > 0) {
      // Delete old ones first
      await client.query("DELETE FROM appointment_analyses WHERE appointment_id = $1", [id]);
      
      for (let i = 0; i < analysisNames.length; i++) {
        if (analysisNames[i]) {
          await client.query(
            "INSERT INTO appointment_analyses (appointment_id, analysis_name, aire_test_subtype) VALUES ($1, $2, $3)",
            [id, analysisNames[i], analysisSubtypes[i] || null]
          );
        }
      }
    } else if (analysis_type) {
      // Legacy fallback
      await client.query("DELETE FROM appointment_analyses WHERE appointment_id = $1", [id]);
      await client.query(
        "INSERT INTO appointment_analyses (appointment_id, analysis_name, aire_test_subtype) VALUES ($1, $2, $3)",
        [id, analysis_type, aire_test_type]
      );
    }

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
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario-domicilio");
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

    // Check limit if moving an air test
    const airTestNames = ['SIBO', 'LACTOSA', 'FRUCTUOSA', 'SIBO C/LACTULON', 'TEST DE AIRE', 'AIRES'];
    if (airTestNames.includes(apt?.analysis_type?.toUpperCase() || "")) {
      const targetDateStr = newDate.split('T')[0];
      const countRes = await pool.query(
        "SELECT COUNT(*) FROM appointments WHERE UPPER(analysis_type) = ANY($1::text[]) AND DATE(appointment_date) = $2 AND id != $3 AND (status IS NULL OR status != 'CANCELADO')",
        [airTestNames, targetDateStr, appointmentId]
      );
      if (parseInt(countRes.rows[0].count) >= 4) {
        throw new Error("Límite excedido: Solo se permiten 4 turnos de pruebas de aire por día.");
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
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario-domicilio");
    revalidatePath("/pacientes", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Update status error:", error);
    return { error: error.message };
  }
}

export async function toggleIndicationsStatus(id: string, status: boolean) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autorizado");

    await pool.query("UPDATE appointments SET indications_sent = $1 WHERE id = $2", [status, id]);

    await logAction("UPDATE_INDICATIONS_STATUS", { 
      appointment_id: id, 
      indications_sent: status 
    });

    revalidatePath("/");
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario-domicilio");
    revalidatePath("/listados/indicaciones");
    
    return { success: true };
  } catch (error: any) {
    console.error("Toggle indications error:", error);
    return { error: error.message };
  }
}

// --- DÍAS BLOQUEADOS (Feriados / Sin atención) — shared across all calendars ---

export async function ensureBlockedDaysTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_days (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL UNIQUE,
        descripcion TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // migrate from old per-calendar table if it exists
    await pool.query(`
      INSERT INTO blocked_days (fecha, descripcion, created_at)
      SELECT fecha, descripcion, created_at FROM aires_blocked_days
      WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aires_blocked_days')
      ON CONFLICT (fecha) DO NOTHING;
    `).catch(() => {});
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getBlockedDays() {
  try {
    const res = await pool.query("SELECT * FROM blocked_days ORDER BY fecha ASC");
    const data = res.rows.map(r => ({
      ...r,
      fecha: r.fecha instanceof Date
        ? r.fecha.toISOString().slice(0, 10)
        : String(r.fecha).slice(0, 10),
    }));
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createBlockedDay(fecha: string, descripcion: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query(
      "INSERT INTO blocked_days (fecha, descripcion) VALUES ($1, $2) ON CONFLICT (fecha) DO UPDATE SET descripcion = EXCLUDED.descripcion",
      [fecha, descripcion || null]
    );
    revalidatePath("/calendario");
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario-domicilio");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBlockedDay(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query("DELETE FROM blocked_days WHERE id = $1", [id]);
    revalidatePath("/calendario");
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario-domicilio");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateBlockedDay(id: number, descripcion: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query(
      "UPDATE blocked_days SET descripcion = $1 WHERE id = $2",
      [descripcion || null, id]
    );
    revalidatePath("/calendario");
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario-domicilio");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

