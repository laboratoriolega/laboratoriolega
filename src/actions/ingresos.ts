"use server";

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

export async function getIngresos(search?: string) {
  try {
    // We fetch everything that is an ingreso OR is a completed/confirmed appointment
    // This includes historical data from internal calendar and domicilio if they have these statuses.
    const res = await pool.query(`
      SELECT a.*, p.name, p.dni, p.phone, p.email, p.health_insurance, p.birth_date, p.address, a.biochemical_notice,
             COALESCE((
               SELECT SUM(cp.monto) 
               FROM coseguro_pagos cp 
               JOIN pago_obrasocial po ON cp.pago_obrasocial_id = po.id 
               WHERE po.ingreso_id = a.id
             ), 0) as total_coseguro_pagado,
             (
               SELECT json_agg(json_build_object('id', aa.id, 'name', aa.analysis_name, 'subtype', aa.aire_test_subtype, 'status', aa.status))
               FROM appointment_analyses aa
               WHERE aa.appointment_id = a.id
             ) as analyses,
             (
               SELECT json_agg(json_build_object('id', ad.id, 'document_url', ad.document_url, 'filename', ad.filename))
               FROM appointment_documents ad
               WHERE ad.appointment_id = a.id
             ) as documents
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.is_ingreso = TRUE 
         OR a.status = 'COMPLETADO' 
         OR a.status = 'CONFIRMAR ASISTENCIA'
      ORDER BY a.appointment_date::date ASC,
        CASE
          WHEN a.report_id ~ '^[0-9]+$' THEN (a.report_id::INTEGER * 2)::FLOAT
          ELSE (
            SELECT COALESCE(MAX(b.report_id::INTEGER), 0) * 2 + 1
            FROM appointments b
            WHERE b.appointment_date::date = a.appointment_date::date
              AND b.report_id ~ '^[0-9]+$'
              AND b.created_at < a.created_at
          )::FLOAT
        END ASC NULLS LAST
    `);

    return {
      data: res.rows.map(row => ({
        ...row,
        name: row.name ? row.name.toUpperCase() : row.name,
        appointment_date: row.appointment_date ? new Date(row.appointment_date).toISOString() : null,
        result_date: row.result_date ? new Date(row.result_date).toISOString() : null,
        total_coseguro_pagado: parseFloat(row.total_coseguro_pagado) || 0
      })),
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching ingresos:", error);
    return { data: null, error: error.message };
  }
}

import { logAction } from './audit';
import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';

export async function createIngreso(formData: FormData) {
  const session = await getSession() as any;
  if (session?.role === 'bioquimico') return { error: 'Sin permiso' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const existingId = formData.get("id") as string;
    const name = (formData.get("name") as string)?.toUpperCase().trim();
    const dni = formData.get("dni") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const birth_date = formData.get("birth_date") as string;
    const health_insurance = formData.get("health_insurance") as string;
    
    const appointment_date_raw = formData.get("appointment_date") as string;
    // Append noon so pure date strings (YYYY-MM-DD) stay in the correct day regardless of DB timezone
    const appointment_date = appointment_date_raw?.length === 10
      ? `${appointment_date_raw}T12:00:00`
      : appointment_date_raw;
    const analysisNames = formData.getAll("analysis_name") as string[];
    const analysisSubtypes = formData.getAll("aire_test_subtype") as string[];
    const analysis_type = analysisNames[0] || ""; // Legacy fallback
    
    // Determine if it should go to the Air Test calendar
    const airTestNames = ['Test de aire', 'SIBO', 'LACTOSA', 'FRUCTUOSA', 'Aires'];
    const airTestIndex = analysisNames.findIndex(name => airTestNames.includes(name));
    let aire_test_type = null;
    if (airTestIndex !== -1) {
      aire_test_type = analysisSubtypes[airTestIndex] || analysisNames[airTestIndex];
    }

    const report_id = formData.get("report_id") as string;
    const result_date = formData.get("result_date") as string;
    const professionalNames = formData.getAll("professional_name") as string[];
    const professional_name = professionalNames.filter(p => p.trim() !== '').join(', ');
    const coseguro = formData.get("coseguro") as string;
    const particular_price = formData.get("particular_price") as string;
    const payment_method = formData.get("payment_method") as string;
    const observations = formData.get("observations") as string;
    const files = formData.getAll("document") as File[];
    const coseguro_agregado = formData.get("coseguro_agregado") === 'true';
    const factura_instante = formData.get("factura_instante") === 'true';
    const payment_combined = formData.get("payment_combined") === 'true';
    const coseguro_payment_method = formData.get("coseguro_payment_method") as string || '';
    const particular_payment_method = formData.get("particular_payment_method") as string || '';

    let patientId;

    if (existingId) {
      // Editing an existing ingreso: check if the name/DNI changed.
      // If they changed, we must NOT update the old patient (other ingresos share it).
      // Instead, find-or-create a patient matching the new DNI+name, and re-link this appointment.
      const existingApt = await client.query(
        "SELECT patient_id, p.name as cur_name, p.dni as cur_dni FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1",
        [existingId]
      );
      const currentPatientId = existingApt.rows[0]?.patient_id;
      const currentName = (existingApt.rows[0]?.cur_name || '').toUpperCase().trim();
      const currentDni = (existingApt.rows[0]?.cur_dni || '').trim();

      const nameChanged = currentName !== name.toUpperCase().trim();
      const dniChanged  = currentDni  !== dni.trim();

      if (!nameChanged && !dniChanged) {
        // Same patient — safe to update contact fields only (email, phone, etc.)
        patientId = currentPatientId;
        if (patientId) {
          await client.query(
            `UPDATE patients SET email = $1, phone = $2, health_insurance = $3,
              birth_date = NULLIF($4, '')::date, address = $5
             WHERE id = $6`,
            [email, phone, health_insurance, birth_date, address, patientId]
          );
        }
      } else {
        // Name or DNI changed → find-or-create the target patient, never touch the old one
        const targetRes = await client.query(
          "SELECT id FROM patients WHERE dni = $1 AND UPPER(name) = UPPER($2)",
          [dni, name]
        );
        if (targetRes.rows.length > 0) {
          patientId = targetRes.rows[0].id;
          // Update contact fields on the target patient
          await client.query(
            `UPDATE patients SET email = $1, phone = $2, health_insurance = $3,
              birth_date = NULLIF($4, '')::date, address = $5
             WHERE id = $6`,
            [email, phone, health_insurance, birth_date, address, patientId]
          );
        } else {
          // Create a brand-new patient record for the new identity
          const creatorName = session?.full_name || session?.username || "Sistema";
          const newPatientRes = await client.query(
            `INSERT INTO patients (name, dni, email, phone, health_insurance, birth_date, address, created_by)
             VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7, $8)
             RETURNING id`,
            [name, dni, email, phone, health_insurance, birth_date, address, creatorName]
          );
          patientId = newPatientRes.rows[0].id;
        }
      }
    } else {
      // New ingreso: find by DNI + name to allow multiple people to share a DNI placeholder ('.')
      const patientRes = await client.query(
        "SELECT id FROM patients WHERE dni = $1 AND UPPER(name) = UPPER($2)",
        [dni, name]
      );
      if (patientRes.rows.length > 0) {
        patientId = patientRes.rows[0].id;
        await client.query(
          `UPDATE patients SET
            email = $1, phone = $2, health_insurance = $3,
            birth_date = NULLIF($4, '')::date, address = $5
           WHERE id = $6`,
          [email, phone, health_insurance, birth_date, address, patientId]
        );
      } else {
        const creatorName = session?.full_name || session?.username || "Sistema";
        const newPatientRes = await client.query(
          `INSERT INTO patients (name, dni, email, phone, health_insurance, birth_date, address, created_by)
           VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7, $8)
           RETURNING id`,
          [name, dni, email, phone, health_insurance, birth_date, address, creatorName]
        );
        patientId = newPatientRes.rows[0].id;
      }
    }

    let aptId;
      if (existingId) {
        // Check if this is a new ingreso from a calendar appointment (is_ingreso=FALSE)
        // or editing an already-existing ingreso (is_ingreso=TRUE)
        const existingAptInfo = await client.query("SELECT is_ingreso, status FROM appointments WHERE id = $1", [existingId]);
        const wasAlreadyIngreso = existingAptInfo.rows[0]?.is_ingreso === true;
        const currentStatus = existingAptInfo.rows[0]?.status;
        
        // If it was already an ingreso, keep its status, unless it was 'CONFIRMAR ASISTENCIA', then make it 'COMPLETADO'
        const newStatus = (wasAlreadyIngreso && currentStatus && currentStatus !== 'CONFIRMAR ASISTENCIA') 
                          ? currentStatus 
                          : 'COMPLETADO';

        // Update existing appointment — also update patient_id in case the linked patient changed
        await client.query(
          `UPDATE appointments SET
            patient_id = $1, analysis_type = $2, aire_test_type = $3, observations = $4,
            status = $18,
            report_id = $5, result_date = NULLIF($6, '')::timestamp,
            coseguro = NULLIF($7, '')::numeric, particular_price = NULLIF($8, '')::numeric,
            payment_method = $9, professional_name = $10, is_ingreso = TRUE,
            appointment_date = COALESCE(NULLIF($12, '')::timestamp, appointment_date),
            coseguro_agregado = $13, factura_instante = $14,
            coseguro_payment_method = NULLIF($15, ''), particular_payment_method = NULLIF($16, ''),
            payment_combined = $17
           WHERE id = $11`,
          [patientId, analysis_type, aire_test_type, observations, report_id, result_date, coseguro, particular_price, payment_method, professional_name, existingId, appointment_date, coseguro_agregado, factura_instante, coseguro_payment_method, particular_payment_method, payment_combined, newStatus]
        );
        aptId = existingId;
        // Clean old analyses and insert new ones
        await client.query("DELETE FROM appointment_analyses WHERE appointment_id = $1", [aptId]);
      } else {
        // Insert Appointment as Ingreso
        const aptRes = await client.query(
          `INSERT INTO appointments
           (patient_id, appointment_date, analysis_type, aire_test_type, observations, status,
            report_id, result_date, coseguro, particular_price, payment_method, professional_name, is_ingreso,
            coseguro_agregado, factura_instante, coseguro_payment_method, particular_payment_method, payment_combined)
           VALUES ($1, $2, $3, $4, $5, 'COMPLETADO', $6, NULLIF($7, '')::timestamp, NULLIF($8, '')::numeric, NULLIF($9, '')::numeric, $10, $11, TRUE, $12, $13, NULLIF($14,''), NULLIF($15,''), $16)
           RETURNING id`,
          [patientId, appointment_date || new Date().toISOString(), analysis_type, aire_test_type, observations, report_id, result_date, coseguro, particular_price, payment_method, professional_name, coseguro_agregado, factura_instante, coseguro_payment_method, particular_payment_method, payment_combined]
        );
        aptId = aptRes.rows[0].id;
      }

    // Insert Analyses (Multiple)
    console.log("Saving analyses:", analysisNames, analysisSubtypes);

    if (analysisNames.length > 0) {
      for (let i = 0; i < analysisNames.length; i++) {
        if (analysisNames[i]) {
          await client.query(
            "INSERT INTO appointment_analyses (appointment_id, analysis_name, aire_test_subtype) VALUES ($1, $2, $3)",
            [aptId, analysisNames[i], analysisSubtypes[i] || null]
          );
        }
      }
    } else if (analysis_type) {
      await client.query(
        "INSERT INTO appointment_analyses (appointment_id, analysis_name, aire_test_subtype) VALUES ($1, $2, $3)",
        [aptId, analysis_type, null]
      );
    }

    // Auto-create cobranza for non-cash payments on new ingresos
    if (!existingId) {
      const isNonCash = (m: string): boolean => !!m && m !== '-' && m !== 'EFECTIVO';
      let hasNonCash: boolean;
      let cobranzaCoseguroMethod: string;
      let cobranzaParticularMethod: string;
      if (payment_combined) {
        const allMethods = [...coseguro_payment_method.split(','), ...particular_payment_method.split(',')]
          .map(m => m.trim()).filter(Boolean);
        hasNonCash = allMethods.some(isNonCash);
        cobranzaCoseguroMethod = coseguro_payment_method;
        cobranzaParticularMethod = particular_payment_method;
      } else {
        hasNonCash = isNonCash(payment_method);
        // Assign method to whichever amount column has a value
        cobranzaCoseguroMethod = (coseguro && parseFloat(coseguro) > 0) ? payment_method : '';
        cobranzaParticularMethod = (particular_price && parseFloat(particular_price) > 0) ? payment_method : '';
        // If only coseguro exists, still surface the method there
        if (!cobranzaCoseguroMethod && !cobranzaParticularMethod) cobranzaCoseguroMethod = payment_method;
      }
      if (hasNonCash || factura_instante) {
        const tipo = factura_instante ? 'factura_instante' : 'pendiente';
        const total = ((parseFloat(coseguro || '0') || 0) + (parseFloat(particular_price || '0') || 0)).toFixed(2);
        const month_group = appointment_date_raw?.substring(0, 7) || new Date().toISOString().substring(0, 7);
        await client.query(
          `INSERT INTO cobranzas (fecha, paciente, ingreso_id, coseguro_amount, coseguro_method, particular_amount, particular_method, total, tipo, observacion, estado_factura, month_group)
           VALUES ($1, $2, $3, NULLIF($4,'')::numeric, NULLIF($5,''), NULLIF($6,'')::numeric, NULLIF($7,''), $8, $9, $10, 'NO FACTURADO', $11)`,
          [appointment_date_raw, name, aptId, coseguro, cobranzaCoseguroMethod, particular_price, cobranzaParticularMethod, total, tipo, observations, month_group]
        );
      }

      // Auto-create pago_obrasocial entry when coseguro is "agregado"
      if (coseguro_agregado && coseguro) {
        const month_group = appointment_date_raw?.substring(0, 7) || new Date().toISOString().substring(0, 7);
        const poMethod = payment_combined ? (coseguro_payment_method || particular_payment_method) : payment_method;
        await client.query(
          `INSERT INTO pago_obrasocial (ingreso_id, fecha, paciente, coseguro_pendiente, seguimiento, month_group, payment_method)
           VALUES ($1, $2, $3, $4, 'Pendiente', $5, $6)`,
          [aptId, appointment_date_raw, name, coseguro, month_group, poMethod || null]
        );
      }
    }

    // Handle File Uploads
    for (const file of files) {
      if (file && file.size > 0) {
        const path = `ingresos/${Date.now()}-${file.name}`;
        const blob = await put(path, file, { access: 'private' });
        await client.query(
          'INSERT INTO appointment_documents (appointment_id, document_url, filename) VALUES ($1, $2, $3)',
          [aptId, blob.url, file.name]
        );
      }
    }

    await client.query('COMMIT');

    // Log action
    await logAction(existingId ? "UPDATE_INGRESO" : "CREATE_INGRESO", {
      patient_name: name,
      dni: dni,
      analysis: analysis_type,
      report_id: report_id,
      payment: payment_method,
      amount: (parseFloat(coseguro || "0") + parseFloat(particular_price || "0")).toFixed(2)
    });

    revalidatePath("/ingresos");
    revalidatePath("/");
    revalidatePath("/calendario-aire");
    revalidatePath("/calendario");
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Create/Update ingreso error:", error);
    return { error: error.message };
  } finally {
    client.release();
  }
}

export async function deleteIngreso(id: string) {
  const session = await getSession() as any;
  if (session?.role === 'bioquimico') return { error: 'Sin permiso' };
  try {
    const res = await pool.query('SELECT a.*, p.name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1', [id]);
    const details = res.rows[0];

    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);

    await logAction("DELETE_INGRESO", {
      patient_name: details?.name,
      analysis: details?.analysis_type,
      report_id: details?.report_id
    });

    revalidatePath("/ingresos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

const BIOQ_ALLOWED_FIELDS = ['result_date', 'checkbox_checked'];

export async function updateIngresoField(id: string, field: string, value: any) {
  const session = await getSession() as any;
  if (session?.role === 'bioquimico' && !BIOQ_ALLOWED_FIELDS.includes(field)) {
    return { error: 'Sin permiso' };
  }
  try {
    const res = await pool.query('SELECT a.*, p.name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1', [id]);
    const details = res.rows[0];

    await pool.query(`UPDATE appointments SET ${field} = $1 WHERE id = $2`, [value, id]);

    const sessionData = await getSession() as any;
    const authorName = sessionData?.full_name || sessionData?.username || "Usuario";

    if (field === 'checkbox_checked') {
      const actionText = value ? "tildó" : "destildó";
      await pool.query(
        `INSERT INTO system_notifications (type, message, target_roles, created_by, link) VALUES ($1, $2, $3, $4, $5)`,
        ['CHECKLIST_TOGGLE', `${authorName} ${actionText} el ingreso de ${details?.name}.`, 'admin,gerente,administracion', authorName, `/ingresos?highlight=${id}`]
      );
    }

    await logAction("UPDATE_INGRESO_FIELD", {
      patient_name: details?.name,
      field: field,
      old_value: details?.[field],
      new_value: value,
      report_id: details?.report_id,
      by: authorName
    });

    revalidatePath("/ingresos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
export async function getNextReportId() {
  const client = await pool.connect();
  try {
    const res = await pool.query(`
      SELECT MAX(CAST(report_id AS INTEGER)) as max_id 
      FROM appointments 
      WHERE report_id ~ '^[0-9]+$'
    `);
    const nextId = (res.rows[0].max_id || 94000) + 1;
    return { success: true, nextId: nextId.toString() };
  } catch (error) {
    console.error("Error getting next report id:", error);
    return { success: false, error: "Error al obtener correlativo" };
  } finally {
    client.release();
  }
}

export async function updateInternalNote(id: string, note: string) {
  try {
    const session = await getSession() as any;
    const authorName = session?.full_name || session?.username || "Usuario Desconocido";
    const authorRole = session?.role || "staff";

    const res = await pool.query('SELECT a.*, p.name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1', [id]);
    const details = res.rows[0];

    if (!details) {
      return { error: "No se encontró el registro" };
    }

    // Insert into internal notes history
    await pool.query(
      `INSERT INTO appointment_internal_notes (appointment_id, note, status, created_by) VALUES ($1, $2, 'unread', $3)`,
      [id, note, authorName]
    );

    // Also update main table for backward compatibility/quick access
    await pool.query(
      `UPDATE appointments SET internal_note = $1, internal_note_status = 'unread' WHERE id = $2`,
      [note, id]
    );

    await logAction("CREATE_INTERNAL_NOTE", {
      patient_name: details?.name,
      report_id: details?.report_id,
      note: note
    });

    // Create system notification for internal note
    // If Admin/Gerente/Administracion adds it, biochemicals should see it too.
    let targetRoles = 'admin,gerente,administracion';
    if (['admin', 'gerente', 'administracion'].includes(authorRole)) {
      targetRoles = 'admin,gerente,administracion,bioquimico';
    }

    await pool.query(
      `INSERT INTO system_notifications (type, message, target_roles, created_by, link) VALUES ($1, $2, $3, $4, $5)`,
      ['INTERNAL_NOTE', `Nota Interna añadida para paciente ${details.name} por ${authorName}.`, targetRoles, authorName, `/ingresos?highlight=${id}`]
    );

    revalidatePath("/ingresos");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateInternalNote:", error);
    return { error: error.message };
  }
}

export async function getInternalNotesHistory(appointmentId: string) {
  try {
    const res = await pool.query(
      'SELECT * FROM appointment_internal_notes WHERE appointment_id = $1 ORDER BY created_at DESC',
      [appointmentId]
    );
    return { success: true, notes: res.rows };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function markInternalNoteAsRead(noteId: number, appointmentId: string) {
  try {
    const session = await getSession() as any;
    const readerName = session?.full_name || session?.username || "Usuario";

    const res = await pool.query('SELECT a.*, p.name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = $1', [appointmentId]);
    const details = res.rows[0];

    if (!details) return { error: "No se encontró el registro" };

    // Update specific note
    await pool.query(
      `UPDATE appointment_internal_notes SET status = 'read', read_by = $1, read_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [readerName, noteId]
    );

    // Check if there are any unread notes left for this appointment
    const unreadRes = await pool.query(
      `SELECT COUNT(*) FROM appointment_internal_notes WHERE appointment_id = $1 AND status = 'unread'`,
      [appointmentId]
    );
    
    if (parseInt(unreadRes.rows[0].count) === 0) {
      // All notes read, update main table status
      await pool.query(`UPDATE appointments SET internal_note_status = 'read' WHERE id = $1`, [appointmentId]);
    }

    await logAction("READ_INTERNAL_NOTE", {
      patient_name: details?.name,
      report_id: details?.report_id,
      reader: readerName
    });

    revalidatePath("/ingresos");
    return { success: true };
  } catch (error: any) {
    console.error("Error in markInternalNoteAsRead:", error);
    return { error: error.message };
  }
}

export async function getGlobalNotifications() {
  try {
    const session = await getSession() as any;
    if (!session) return { data: [] };
    const role = session.role;
    const readerName = session?.full_name || session?.username || "Usuario";
    
    const res = await pool.query(
      `SELECT n.*, 
              (CASE WHEN r.username IS NOT NULL THEN 'read' ELSE 'unread' END) as status,
              (SELECT username FROM system_notification_reads WHERE notification_id = n.id ORDER BY read_at ASC LIMIT 1) as first_reader
       FROM system_notifications n
       LEFT JOIN system_notification_reads r ON n.id = r.notification_id AND r.username = $2
       WHERE n.target_roles ILIKE $1 
       ORDER BY n.created_at DESC LIMIT 50`,
      [`%${role}%`, readerName]
    );
    return { data: res.rows };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function markGlobalNotificationRead(notifId: number) {
  try {
    const session = await getSession() as any;
    const readerName = session?.full_name || session?.username || "Usuario";

    await pool.query(
      `INSERT INTO system_notification_reads (notification_id, username) 
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [notifId, readerName]
    );
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function markAllGlobalNotificationsRead() {
  try {
    const session = await getSession() as any;
    if (!session) return { error: 'No auth' };
    const readerName = session?.full_name || session?.username || "Usuario";
    const role = session.role;

    await pool.query(
      `INSERT INTO system_notification_reads (notification_id, username)
       SELECT n.id, $1 FROM system_notifications n
       WHERE n.target_roles ILIKE $2
       ON CONFLICT DO NOTHING`,
      [readerName, `%${role}%`]
    );
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function ensureIngresosExtColumns() {
  try {
    await pool.query(`
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS coseguro_agregado BOOLEAN DEFAULT FALSE;
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS factura_instante BOOLEAN DEFAULT FALSE;
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS coseguro_payment_method VARCHAR(200);
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS particular_payment_method VARCHAR(200);
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_combined BOOLEAN DEFAULT FALSE;
      CREATE TABLE IF NOT EXISTS pago_obrasocial (
        id SERIAL PRIMARY KEY,
        ingreso_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        fecha DATE NOT NULL,
        paciente TEXT NOT NULL,
        coseguro_pendiente NUMERIC NOT NULL DEFAULT 0,
        seguimiento VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        month_group VARCHAR(7) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS coseguro_pagos (
        id SERIAL PRIMARY KEY,
        pago_obrasocial_id INTEGER REFERENCES pago_obrasocial(id) ON DELETE CASCADE,
        monto NUMERIC NOT NULL,
        fecha DATE NOT NULL,
        detalle TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE pago_obrasocial ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
      ALTER TABLE coseguro_pagos ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
      
      CREATE TABLE IF NOT EXISTS appointment_internal_notes (
        id SERIAL PRIMARY KEY,
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'unread',
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_by VARCHAR(100),
        read_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS system_notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'unread',
        target_roles TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_by VARCHAR(100),
        read_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS system_notification_reads (
        notification_id INTEGER REFERENCES system_notifications(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (notification_id, username)
      );
    `);
    return { success: true };
  } catch (error: any) {
    console.error("ensureIngresosExtColumns error:", error);
    return { error: error.message };
  }
}

export async function updateBiochemicalNotice(appointmentId: string, value: string) {
  try {
    await pool.query(
      "UPDATE appointments SET biochemical_notice = $1 WHERE id = $2",
      [value, appointmentId]
    );

    const aptRes = await pool.query(`
      SELECT p.name 
      FROM appointments a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.id = $1
    `, [appointmentId]);
    
    const patientName = aptRes.rows[0]?.name || "Desconocido";

    await logAction("UPDATE_BIOCHEMICAL_NOTICE", {
      patient_name: patientName,
      field: "Aviso Bioq.",
      new_value: value || "Vacío"
    });

    revalidatePath("/ingresos");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating biochemical notice:", error);
    return { error: error.message };
  }
}
