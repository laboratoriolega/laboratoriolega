"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAction } from "./audit";
import { put, del } from "@vercel/blob";
import { getPatients } from "./patients";
import { format } from "date-fns";
import { redirect } from "next/navigation";

// --- PENDIENTES ---

export async function getPendientes() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query("SELECT * FROM pendientes ORDER BY month_group DESC, fecha DESC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createPendiente(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fecha = formData.get("fecha") as string;
    const paciente = (formData.get("paciente") as string)?.toUpperCase().trim();
    const pendiente = formData.get("pendiente") as string;
    const detalle = formData.get("detalle") as string;
    const seguimiento = formData.get("seguimiento") as string;
    const observaciones = formData.get("observaciones") as string;

    const month_group = fecha.substring(0, 7); // 'YYYY-MM'

    await pool.query(
      "INSERT INTO pendientes (fecha, paciente, pendiente, detalle, seguimiento, observaciones, month_group) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [fecha, paciente, pendiente, detalle, seguimiento, observaciones, month_group]
    );

    await logAction("CREATE_PENDIENTE", { paciente, month_group });
    revalidatePath("/listados/pendientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePendiente(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(data);

    await pool.query(`UPDATE pendientes SET ${fields} WHERE id = $${values.length + 1}`, [...values, id]);

    revalidatePath("/listados/pendientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePendiente(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM pendientes WHERE id = $1", [id]);
    revalidatePath("/listados/pendientes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- SYSTEM CODES ---

export async function getSystemCodes() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query("SELECT * FROM system_codes ORDER BY analisis ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateSystemCode(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(data);

    await pool.query(`UPDATE system_codes SET ${fields} WHERE id = $${values.length + 1}`, [...values, id]);

    revalidatePath("/listados/codigos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createSystemCode(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const analisis = formData.get("analisis") as string;
    const codigo_sistema = formData.get("codigo_sistema") as string;
    const codigo_nbu = formData.get("codigo_nbu") as string;

    const ub = formData.get("ub") as string || "-";

    await pool.query(
      "INSERT INTO system_codes (analisis, codigo_sistema, codigo_nbu, ub) VALUES ($1, $2, $3, $4)",
      [analisis, codigo_sistema, codigo_nbu, ub]
    );

    revalidatePath("/listados/codigos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSystemCode(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM system_codes WHERE id = $1", [id]);
    revalidatePath("/listados/codigos");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- OSDE CODES ---

export async function ensureOsdeCodesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS osde_codes (
        id SERIAL PRIMARY KEY,
        analisis TEXT NOT NULL,
        codigo_sistema VARCHAR(100),
        estado VARCHAR(50) DEFAULT 'Requiere Autorización',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE osde_codes ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Requiere Autorización';
    `);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getOsdeCodes() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query("SELECT * FROM osde_codes ORDER BY analisis ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateOsdeCode(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(data);

    await pool.query(`UPDATE osde_codes SET ${fields} WHERE id = $${values.length + 1}`, [...values, id]);

    revalidatePath("/listados/osde");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createOsdeCode(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const analisis = formData.get("analisis") as string;
    const codigo_sistema = formData.get("codigo_sistema") as string;
    const estado = (formData.get("estado") as string) || 'Requiere Autorización';

    await pool.query(
      "INSERT INTO osde_codes (analisis, codigo_sistema, estado) VALUES ($1, $2, $3)",
      [analisis, codigo_sistema, estado]
    );

    revalidatePath("/listados/osde");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteOsdeCode(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM osde_codes WHERE id = $1", [id]);
    revalidatePath("/listados/osde");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- BILLING PRICES ---

export async function getBillingPrices() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query("SELECT * FROM billing_prices ORDER BY analisis ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateBillingPrice(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(data);

    await pool.query(`UPDATE billing_prices SET ${fields} WHERE id = $${values.length + 1}`, [...values, id]);

    revalidatePath("/listados/precios");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createBillingPrice(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const analisis = formData.get("analisis") as string;
    const cibic = formData.get("cibic") as string;
    const gornitz = formData.get("gornitz") as string;
    const fpm = formData.get("fpm") as string;
    const manlab = formData.get("manlab") as string;
    const lerda = formData.get("lerda") as string;

    await pool.query(
      "INSERT INTO billing_prices (analisis, cibic, gornitz, fpm, manlab, lerda) VALUES ($1, $2, $3, $4, $5, $6)",
      [analisis, cibic, gornitz, fpm, manlab, lerda]
    );

    revalidatePath("/listados/precios");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBillingPrice(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM billing_prices WHERE id = $1", [id]);
    revalidatePath("/listados/precios");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- COBRANZAS ---

export async function getCobranzas() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query(`
      SELECT c.*,
             p.name as ingreso_paciente_name
      FROM cobranzas c
      LEFT JOIN appointments a ON a.id = c.ingreso_id
      LEFT JOIN patients p ON p.id = a.patient_id
      ORDER BY c.month_group DESC, c.fecha DESC
    `);
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createCobranza(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fecha = formData.get("fecha") as string;
    const paciente = (formData.get("paciente") as string)?.toUpperCase().trim();
    const dni = formData.get("dni") as string;
    const factura = formData.get("factura") as string || null;
    const nro_factura = formData.get("nro_factura") as string || null;
    const observacion = formData.get("observacion") as string;
    const seguimiento = (formData.get("seguimiento") as string) || 'Pendiente';
    const tipo = (formData.get("tipo") as string) || 'manual';
    const coseguro_amount = formData.get("coseguro_amount") as string || null;
    const particular_amount = formData.get("particular_amount") as string || null;
    const total = coseguro_amount || particular_amount
      ? String((parseFloat(coseguro_amount || '0') || 0) + (parseFloat(particular_amount || '0') || 0))
      : null;

    const month_group = fecha.substring(0, 7);

    await pool.query(
      `INSERT INTO cobranzas (fecha, paciente, dni, factura, nro_factura, observacion, seguimiento, tipo, coseguro_amount, particular_amount, total, estado_factura, month_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULLIF($9,'')::numeric, NULLIF($10,'')::numeric, NULLIF($11,'')::numeric, 'NO FACTURADO', $12)`,
      [fecha, paciente, dni, factura, nro_factura, observacion, seguimiento, tipo, coseguro_amount, particular_amount, total, month_group]
    );

    await logAction("CREATE_COBRANZA", { paciente, tipo });
    revalidatePath("/listados/cobranzas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCobranza(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(data);

    await pool.query(`UPDATE cobranzas SET ${fields} WHERE id = $${values.length + 1}`, [...values, id]);

    revalidatePath("/listados/cobranzas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCobranza(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM cobranzas WHERE id = $1", [id]);
    revalidatePath("/listados/cobranzas");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function ensureCobranzasTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cobranzas (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        paciente TEXT NOT NULL,
        dni TEXT,
        factura TEXT,
        observacion TEXT,
        seguimiento TEXT NOT NULL DEFAULT 'Pendiente',
        month_group TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS ingreso_id UUID;
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS coseguro_amount NUMERIC;
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS coseguro_method VARCHAR(200);
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS particular_amount NUMERIC;
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS particular_method VARCHAR(200);
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS total NUMERIC;
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) DEFAULT 'manual';
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS nro_factura VARCHAR(100);
      ALTER TABLE cobranzas ADD COLUMN IF NOT EXISTS estado_factura VARCHAR(30) DEFAULT 'NO FACTURADO';
    `);
    return { success: true };
  } catch (error: any) {
    console.error("Migration auto-run failed:", error);
    return { error: error.message };
  }
}
// --- APROSS ---

export async function getApross() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query(`
      SELECT a.*, 
             COALESCE((SELECT json_agg(json_build_object('id', d.id, 'url', d.document_url, 'filename', d.filename))
              FROM apross_documents d WHERE d.apross_id = a.id), '[]'::json) as documents
      FROM apross a 
      ORDER BY month_group DESC, fecha DESC
    `);
    return { 
      data: JSON.parse(JSON.stringify(res.rows)), 
      error: null 
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createApross(formData: FormData) {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const fecha = formData.get("fecha") as string;
    const paciente = (formData.get("paciente") as string)?.toUpperCase().trim();
    const dni = formData.get("dni") as string || "-";
    const telefono = formData.get("telefono") as string || "-";
    const analisisList = formData.getAll("analisis") as string[];
    const analisis = analisisList.filter(a => a && a.trim() !== "").join(", ");
    
    // Handle numeric fields that might contain "-"
    const coseguroRaw = formData.get("coseguro") as string;
    const particularEfvRaw = formData.get("particular_efv") as string;
    const particularTarjetaRaw = formData.get("particular_tarjeta") as string;
    
    const parseNumeric = (val: string) => {
      if (!val || val === "-") return null;
      const cleaned = val.replace(/[^0-9.-]/g, "");
      return isNaN(parseFloat(cleaned)) ? null : cleaned;
    };

    const coseguro = parseNumeric(coseguroRaw);
    const particular_efv = parseNumeric(particularEfvRaw);
    const particular_tarjeta = parseNumeric(particularTarjetaRaw);
    
    const observaciones = formData.get("observaciones") as string;
    const files = formData.getAll("documents") as File[];

    const month_group = fecha ? fecha.substring(0, 7) : format(new Date(), "yyyy-MM");

    // --- Patient Persistence Logic ---
    const dni_clean = dni ? String(dni).trim() : "-";
    if (dni_clean !== "-") {
      const patientRes = await client.query(
        "SELECT id FROM patients WHERE dni = $1 AND UPPER(name) = UPPER($2)",
        [dni_clean, paciente]
      );
      if (patientRes.rows.length > 0) {
        const patientId = patientRes.rows[0].id;
        await client.query(
          `UPDATE patients SET
             phone = $1,
             health_insurance = 'APROSS'
           WHERE id = $2`,
          [telefono, patientId]
        );
      } else {
        const session = await getSession() as any;
        const creatorName = session?.full_name || session?.username || "Sistema";
        await client.query(
          `INSERT INTO patients (id, name, dni, phone, health_insurance, created_by)
           VALUES (gen_random_uuid(), $1, $2, $3, 'APROSS', $4)`,
          [paciente, dni_clean, telefono, creatorName]
        );
      }
    }
    // ---------------------------------

    const res = await client.query(
      `INSERT INTO apross (fecha, paciente, dni, telefono, analisis, coseguro, particular_efv, particular_tarjeta, observaciones, month_group) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id`,
      [fecha, paciente, dni, telefono, analisis, coseguro, particular_efv, particular_tarjeta, observaciones, month_group]
    );

    const aprossId = res.rows[0].id;

    // Handle File Uploads
    for (const file of files) {
      if (file && file.size > 0) {
        const path = `apross/${Date.now()}-${file.name}`;
        const blob = await put(path, file, { access: 'private' });
        await client.query(
          'INSERT INTO apross_documents (apross_id, document_url, filename) VALUES ($1, $2, $3)',
          [aprossId, blob.url, file.name]
        );
      }
    }

    await client.query('COMMIT');
    await logAction("CREATE_APROSS", { paciente, month_group });
    revalidatePath("/listados/apross");
    return { success: true };
  } catch (error: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (e) {}
    }
    console.error("CREATE_APROSS_ERROR:", error);
    return { error: String(error.message || error) };
  } finally {
    if (client) client.release();
  }
}

export async function updateApross(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    // data could be an object (from Object.fromEntries) or FormData
    const formData = data instanceof FormData ? data : null;
    const fields = formData ? Object.fromEntries(formData) : data;

    const { fecha, paciente, dni, telefono, analisis, coseguro, particular_efv, particular_tarjeta, observaciones } = fields;
    const month_group = fecha ? String(fecha).substring(0, 7) : null;
    
    const parseNumeric = (val: any) => {
      if (val === undefined || val === null || val === "" || val === "-") return null;
      const cleaned = String(val).replace(/[^0-9.-]/g, "");
      return isNaN(parseFloat(cleaned)) ? null : cleaned;
    };

    // --- Patient Persistence Logic ---
    const dni_clean = dni ? String(dni).trim() : "-";
    if (dni_clean !== "-") {
      const patientRes = await pool.query(
        "SELECT id FROM patients WHERE dni = $1 AND UPPER(name) = UPPER($2)",
        [dni_clean, paciente]
      );
      if (patientRes.rows.length > 0) {
        const patientId = patientRes.rows[0].id;
        await pool.query(
          `UPDATE patients SET
             phone = $1,
             health_insurance = 'APROSS'
           WHERE id = $2`,
          [telefono, patientId]
        );
      } else {
        const session = await getSession() as any;
        const creatorName = session?.full_name || session?.username || "Sistema";
        await pool.query(
          `INSERT INTO patients (id, name, dni, phone, health_insurance, created_by)
           VALUES (gen_random_uuid(), $1, $2, $3, 'APROSS', $4)`,
          [paciente, dni_clean, telefono, creatorName]
        );
      }
    }
    // ---------------------------------

    await pool.query(
      `UPDATE apross SET 
        fecha = $1, paciente = $2, dni = $3, telefono = $4, 
        analisis = $5, coseguro = $6, particular_efv = $7, particular_tarjeta = $8,
        observaciones = $9, month_group = COALESCE($10, month_group)
       WHERE id = $11`,
      [fecha, paciente, dni, telefono, analisis, parseNumeric(coseguro), parseNumeric(particular_efv), parseNumeric(particular_tarjeta), observaciones, month_group, id]
    );

    // Handle NEW File Uploads if FormData was provided
    if (formData) {
      const files = formData.getAll("documents") as File[];
      for (const file of files) {
        if (file && file.size > 0) {
          const path = `apross/${Date.now()}-${file.name}`;
          const blob = await put(path, file, { access: 'private' });
          await pool.query(
            'INSERT INTO apross_documents (apross_id, document_url, filename) VALUES ($1, $2, $3)',
            [id, blob.url, file.name]
          );
        }
      }
    }
    
    revalidatePath("/listados/apross");
    return { success: true };
  } catch (error: any) {
    console.error("UPDATE_APROSS_ERROR:", error);
    return { error: error.message };
  }
}

export async function deleteAprossDocument(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    // Get URL to delete from Blob
    const res = await pool.query('SELECT document_url FROM apross_documents WHERE id = $1', [id]);
    if (res.rows[0]) {
       try { await del(res.rows[0].document_url); } catch (e) {}
    }

    await pool.query('DELETE FROM apross_documents WHERE id = $1', [id]);
    revalidatePath("/listados/apross");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteApross(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM apross WHERE id = $1", [id]);
    revalidatePath("/listados/apross");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- FACTURACION OBRAS SOCIALES ---

// defined in src/lib/constants.ts — not re-exported here (use server files can only export async functions)

export async function getFacturacionOS(obraSocial: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    if (session.role === 'bioquimico') throw new Error("Sin permiso");

    const res = await pool.query(`
      SELECT f.*,
             COALESCE((SELECT json_agg(json_build_object('id', d.id, 'url', d.document_url, 'filename', d.filename))
              FROM facturacion_os_documents d WHERE d.facturacion_id = f.id), '[]'::json) as documents
      FROM facturacion_os f
      WHERE f.obra_social = $1
      ORDER BY f.month_group DESC, f.fecha DESC
    `, [obraSocial]);
    return { data: JSON.parse(JSON.stringify(res.rows)), error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createFacturacionOS(formData: FormData) {
  let client;
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    if (session.role === 'bioquimico') throw new Error("Sin permiso");

    client = await pool.connect();
    await client.query('BEGIN');

    const obra_social = formData.get("obra_social") as string;
    const fecha = formData.get("fecha") as string;
    const nro_factura = formData.get("nro_factura") as string;
    const detalle = formData.get("detalle") as string;
    const seguimiento = formData.get("seguimiento") as string || 'Falta Pagos';
    const files = formData.getAll("documents") as File[];
    const month_group = fecha ? fecha.substring(0, 7) : format(new Date(), "yyyy-MM");

    const res = await client.query(
      `INSERT INTO facturacion_os (obra_social, fecha, nro_factura, detalle, seguimiento, month_group)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [obra_social, fecha, nro_factura || null, detalle || null, seguimiento, month_group]
    );
    const facturacionId = res.rows[0].id;

    for (const file of files) {
      if (file && file.size > 0) {
        const path = `facturacion-os/${Date.now()}-${file.name}`;
        const blob = await put(path, file, { access: 'private' });
        await client.query(
          'INSERT INTO facturacion_os_documents (facturacion_id, document_url, filename) VALUES ($1, $2, $3)',
          [facturacionId, blob.url, file.name]
        );
      }
    }

    await client.query('COMMIT');
    await logAction("CREATE_FACTURACION_OS", { obra_social, nro_factura, fecha });
    revalidatePath("/facturacion");
    return { success: true };
  } catch (error: any) {
    if (client) await client.query('ROLLBACK');
    return { error: error.message };
  } finally {
    if (client) client.release();
  }
}

export async function updateFacturacionOS(id: number, formData: FormData) {
  let client;
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    if (session.role === 'bioquimico') throw new Error("Sin permiso");

    client = await pool.connect();
    await client.query('BEGIN');

    const fecha = formData.get("fecha") as string;
    const nro_factura = formData.get("nro_factura") as string;
    const detalle = formData.get("detalle") as string;
    const seguimiento = formData.get("seguimiento") as string;
    const files = formData.getAll("documents") as File[];
    const month_group = fecha ? fecha.substring(0, 7) : format(new Date(), "yyyy-MM");

    const canEditSeguimiento = session.role === 'admin' || session.role === 'gerente';

    if (canEditSeguimiento) {
      await client.query(
        `UPDATE facturacion_os SET fecha = $1, nro_factura = $2, detalle = $3, seguimiento = $4, month_group = $5 WHERE id = $6`,
        [fecha, nro_factura || null, detalle || null, seguimiento, month_group, id]
      );
    } else {
      await client.query(
        `UPDATE facturacion_os SET fecha = $1, nro_factura = $2, detalle = $3, month_group = $4 WHERE id = $5`,
        [fecha, nro_factura || null, detalle || null, month_group, id]
      );
    }

    for (const file of files) {
      if (file && file.size > 0) {
        const path = `facturacion-os/${Date.now()}-${file.name}`;
        const blob = await put(path, file, { access: 'private' });
        await client.query(
          'INSERT INTO facturacion_os_documents (facturacion_id, document_url, filename) VALUES ($1, $2, $3)',
          [id, blob.url, file.name]
        );
      }
    }

    await client.query('COMMIT');
    revalidatePath("/facturacion");
    return { success: true };
  } catch (error: any) {
    if (client) await client.query('ROLLBACK');
    return { error: error.message };
  } finally {
    if (client) client.release();
  }
}

export async function updateFacturacionOSSeguimiento(id: number, seguimiento: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    if (!['admin', 'gerente'].includes(session.role)) throw new Error("Sin permiso");

    await pool.query(`UPDATE facturacion_os SET seguimiento = $1 WHERE id = $2`, [seguimiento, id]);
    revalidatePath("/facturacion");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteFacturacionOS(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    if (session.role === 'bioquimico') throw new Error("Sin permiso");

    await pool.query("DELETE FROM facturacion_os WHERE id = $1", [id]);
    revalidatePath("/facturacion");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteFacturacionOSDocument(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query('SELECT document_url FROM facturacion_os_documents WHERE id = $1', [id]);
    if (res.rows[0]) {
      try { await del(res.rows[0].document_url); } catch (e) {}
    }
    await pool.query('DELETE FROM facturacion_os_documents WHERE id = $1', [id]);
    revalidatePath("/facturacion");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- PAGO OBRA SOCIAL ---

export async function getPagoObrasocial() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const res = await pool.query(`
      SELECT po.*,
             COALESCE(
               json_agg(json_build_object('id', cp.id, 'monto', cp.monto, 'fecha', cp.fecha, 'detalle', cp.detalle, 'payment_method', cp.payment_method, 'created_at', cp.created_at)
               ORDER BY cp.fecha ASC, cp.created_at ASC)
               FILTER (WHERE cp.id IS NOT NULL),
               '[]'::json
             ) as pagos,
             COALESCE(SUM(cp.monto), 0) as total_pagado
      FROM pago_obrasocial po
      LEFT JOIN coseguro_pagos cp ON cp.pago_obrasocial_id = po.id
      GROUP BY po.id
      ORDER BY po.month_group DESC, po.fecha DESC
    `);
    return { data: JSON.parse(JSON.stringify(res.rows)), error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addCoseguroPago(pago_obrasocial_id: number, monto: number, fecha: string, detalle: string, payment_method?: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const check = await pool.query("SELECT seguimiento FROM pago_obrasocial WHERE id = $1", [pago_obrasocial_id]);
    if (check.rows[0]?.seguimiento === 'Completo') {
      return { error: "Este registro está completo y no acepta más pagos." };
    }

    await pool.query(
      "INSERT INTO coseguro_pagos (pago_obrasocial_id, monto, fecha, detalle, payment_method) VALUES ($1, $2, $3, $4, $5)",
      [pago_obrasocial_id, monto, fecha, detalle || null, payment_method || null]
    );

    revalidatePath("/listados/pago-obrasocial");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePagoObrasocialSeguimiento(id: number, seguimiento: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("UPDATE pago_obrasocial SET seguimiento = $1 WHERE id = $2", [seguimiento, id]);
    revalidatePath("/listados/pago-obrasocial");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePagoObrasocial(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await pool.query("DELETE FROM pago_obrasocial WHERE id = $1", [id]);
    revalidatePath("/listados/pago-obrasocial");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- OBRAS SOCIALES ADMIN ---

export async function ensureObrasSocialesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS obras_sociales_catalog (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO obras_sociales_catalog (nombre) VALUES
        ('PARTICULAR'), ('A.A.T.R.A. - OSTYR - (SCIS S.A. )'), ('A.M.U.R.'), ('A.P.M.'), ('ALCAT'),
        ('APROSS'), ('AVALIAN'), ('CAJA DE ABOGADOS'), ('CAJA NOTARIAL'), ('CEA - SAN PEDRO'),
        ('CIENCIAS ECONOMICAS'), ('CIBIC'), ('COBERTURA DE SALUD S.A. (BOREAL)'), ('D.A.S.P.U.'),
        ('DA.SU.Te.N'), ('DERIVACION'), ('FEDERADA SALUD'), ('GALENO'), ('GRUPO PREMEDIC'), ('IOSFA'),
        ('JERARQUICOS SALUD'), ('JUJUY'), ('LUIS PASTEUR'), ('MEDIFE'), ('METABOLOMICA'),
        ('O.P.D.E.A.'), ('O.S.P.E.R.Y.H.R.A.'), ('O.S.P.I.A.'), ('O.S.P.I.G.P.C.'),
        ('OBRA SOCIAL PERSONAL DE FARMACIA (O.S.P.F.)'), ('OSADEF'), ('OSFFENTOS'), ('OSMISS'),
        ('OSPACA'), ('OSPCRA'), ('OSPECOR'), ('OSPEP'), ('OSPICAL ENSALUD'), ('OSPIHMP'), ('OSPIM'),
        ('OSPJTAP'), ('OSPL'), ('OSSACRA AMA SALUD'), ('OSTEL'), ('OSDE'), ('PAMI'), ('PODER JUDICIAL'),
        ('PREVENCION SALUD'), ('RIO 1°'), ('S.A.D.A.I.C.'), ('S.A.P.'), ('SANCOR SALUD'),
        ('SUPERINTEND.DE BIENESTAR POLICIA FEDERAL ARG.'), ('SWISS MEDICAL'),
        ('UNION PERSONAL'), ('VETERANOS DE GUERRA')
      ON CONFLICT (nombre) DO NOTHING;
    `);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getObrasSociales() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await ensureObrasSocialesTable();
    const res = await pool.query("SELECT * FROM obras_sociales_catalog ORDER BY nombre ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createObraSocial(nombre: string) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    const nombreUpper = nombre.trim().toUpperCase();
    await pool.query(
      "INSERT INTO obras_sociales_catalog (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET activo = TRUE",
      [nombreUpper]
    );
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateObraSocial(id: number, nombre: string, activo: boolean) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    await pool.query(
      "UPDATE obras_sociales_catalog SET nombre = $1, activo = $2 WHERE id = $3",
      [nombre.trim().toUpperCase(), activo, id]
    );
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteObraSocial(id: number) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    await pool.query("DELETE FROM obras_sociales_catalog WHERE id = $1", [id]);
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- PROFESIONALES ADMIN ---

export async function ensureProfesionalesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profesionales_catalog (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getProfesionales() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await ensureProfesionalesTable();
    const res = await pool.query("SELECT * FROM profesionales_catalog ORDER BY nombre ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createProfesional(nombre: string) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    const nombreUpper = nombre.trim().toUpperCase();
    await pool.query(
      "INSERT INTO profesionales_catalog (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET activo = TRUE",
      [nombreUpper]
    );
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProfesional(id: number, nombre: string, activo: boolean) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    await pool.query(
      "UPDATE profesionales_catalog SET nombre = $1, activo = $2 WHERE id = $3",
      [nombre.trim().toUpperCase(), activo, id]
    );
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteProfesional(id: number) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    await pool.query("DELETE FROM profesionales_catalog WHERE id = $1", [id]);
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- TIPOS DE ANALISIS ADMIN ---

export async function ensureTiposAnalisisTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_analisis_catalog (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO tipos_analisis_catalog (nombre) VALUES
        ('SIBO'), ('LACTOSA'), ('FRUCTUOSA'), ('SIBO C/LACTULON'), ('PYLORI'), 
        ('EXTRACCION'), ('MATERIA FECAL'), ('ORINA'), ('PANEL 105'), ('PANEL 63'), 
        ('ALCAT'), ('CIBIC')
      ON CONFLICT (nombre) DO NOTHING;
    `);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getTiposAnalisis() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");

    await ensureTiposAnalisisTable();
    const res = await pool.query("SELECT * FROM tipos_analisis_catalog ORDER BY nombre ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createTipoAnalisis(nombre: string) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    const nombreUpper = nombre.trim().toUpperCase();
    await pool.query(
      "INSERT INTO tipos_analisis_catalog (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET activo = TRUE",
      [nombreUpper]
    );
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateTipoAnalisis(id: number, nombre: string, activo: boolean) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    await pool.query(
      "UPDATE tipos_analisis_catalog SET nombre = $1, activo = $2 WHERE id = $3",
      [nombre.trim().toUpperCase(), activo, id]
    );
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteTipoAnalisis(id: number) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Sin permiso");

    await pool.query("DELETE FROM tipos_analisis_catalog WHERE id = $1", [id]);
    revalidatePath("/admin-lega");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- NOTAS WS ---
export async function getNotas() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    const res = await pool.query("SELECT * FROM notas_ws ORDER BY created_at DESC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createNota(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    const titulo = formData.get("titulo") as string;
    const contenido = formData.get("contenido") as string;
    const color = formData.get("color") as string || '#fef68a';
    await pool.query("INSERT INTO notas_ws (titulo, contenido, color) VALUES ($1, $2, $3)", [titulo, contenido, color]);
    revalidatePath("/listados/notes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateNota(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = Object.values(data);
    await pool.query(`UPDATE notas_ws SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1}`, [...values, id]);
    revalidatePath("/listados/notes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteNota(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query("DELETE FROM notas_ws WHERE id = $1", [id]);
    revalidatePath("/listados/notes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// --- ANALISIS LISTA ---
export async function getAnalisisLista() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    const res = await pool.query("SELECT * FROM analisis_lista ORDER BY id ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createAnalisisLista(data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query(
      "INSERT INTO analisis_lista (data) VALUES ($1)",
      [JSON.stringify(data)]
    );
    revalidatePath("/listados/analisis");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateAnalisisLista(id: number, data: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query(`UPDATE analisis_lista SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [JSON.stringify(data), id]);
    revalidatePath("/listados/analisis");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAnalisisLista(id: number) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    await pool.query("DELETE FROM analisis_lista WHERE id = $1", [id]);
    revalidatePath("/listados/analisis");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAnalisisConfig() {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    const res = await pool.query("SELECT config FROM analisis_lista_config LIMIT 1");
    if (res.rows.length === 0) return { data: null, error: "Config not found" };
    return { data: res.rows[0].config, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateAnalisisConfig(config: any) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("No autenticado");
    // Ensure only admins or those with write permission can change config
    if (session.role !== 'admin' && session.custom_permissions?.["listados:analisis"] !== "write") {
       throw new Error("No tienes permisos para modificar la configuración");
    }
    await pool.query("UPDATE analisis_lista_config SET config = $1 WHERE id = (SELECT id FROM analisis_lista_config LIMIT 1)", [JSON.stringify(config)]);
    revalidatePath("/listados/analisis");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
