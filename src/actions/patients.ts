"use server";

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPatients() {
  try {
    const res = await pool.query(`
      SELECT p.*,
        (
          SELECT json_agg(phi.health_insurance ORDER BY phi.last_used_at DESC)
          FROM patient_health_insurances phi
          WHERE phi.patient_id = p.id
        ) AS health_insurance_list
      FROM patients p
      ORDER BY p.name ASC
    `);
    return {
      data: res.rows.map(row => ({
        ...row,
        name: row.name ? row.name.toUpperCase() : row.name,
        birth_date: row.birth_date ? new Date(row.birth_date).toISOString() : null,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
        created_by: row.created_by || null,
        health_insurance_list: row.health_insurance_list || []
      })),
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return { data: null, error: error.message };
  }
}

export async function updatePatient(formData: FormData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = formData.get("id");
    const name = (formData.get("name") as string)?.toUpperCase().trim();
    const dni = formData.get("dni") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const birth_date = formData.get("birth_date") as string;

    await client.query(
      `UPDATE patients SET 
        name = $1, 
        dni = $2, 
        phone = $3, 
        email = $4, 
        health_insurance = $5,
        birth_date = NULLIF($6, '')::date
      WHERE id = $7`,
      [name, dni, phone, email, health_insurance, birth_date, id]
    );

    // Upsert each OS in the list into patient_health_insurances
    const insuranceListRaw = formData.get("health_insurance_list") as string;
    if (insuranceListRaw) {
      const insurances = insuranceListRaw.split('|||').map(s => s.trim()).filter(Boolean);
      for (const ins of insurances) {
        await client.query(
          `INSERT INTO patient_health_insurances (patient_id, health_insurance, last_used_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (patient_id, health_insurance) DO UPDATE SET last_used_at = NOW()`,
          [id, ins]
        );
      }
    }

    // Remove any OS that were explicitly deleted (sent as health_insurance_removed)
    const removedRaw = formData.get("health_insurance_removed") as string;
    if (removedRaw) {
      const removed = removedRaw.split('|||').map(s => s.trim()).filter(Boolean);
      for (const ins of removed) {
        await client.query(
          `DELETE FROM patient_health_insurances WHERE patient_id = $1 AND health_insurance = $2`,
          [id, ins]
        );
      }
    }

    await client.query('COMMIT');

    revalidatePath("/pacientes");
    revalidatePath("/pacientes/[id]", "page");
    revalidatePath("/");
    revalidatePath("/calendario");
    
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Update patient error:", error);
    return { error: error.message };
  } finally {
    client.release();
  }
}
export async function deletePatient(id: string) {
  try {
    await pool.query('DELETE FROM patients WHERE id = $1', [id]);
    revalidatePath("/pacientes");
    return { success: true };
  } catch (error: any) {
    console.error("Delete patient error:", error);
    return { error: error.message };
  }
}

export async function createPatient(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.toUpperCase().trim();
    const dni = formData.get("dni") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const birth_date = formData.get("birth_date") as string;
    const address = formData.get("address") as string;

    if (!name || !dni) return { error: "Nombre y DNI son requeridos" };

    const res = await pool.query(
      `INSERT INTO patients (name, dni, email, phone, health_insurance, birth_date, address)
       VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7)
       RETURNING id`,
      [name, dni, email || null, phone || null, health_insurance || null, birth_date, address || null]
    );

    revalidatePath("/pacientes");
    revalidatePath("/");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    console.error("Create patient error:", error);
    return { error: error.message };
  }
}


export async function searchPatients(query: string) {
  try {
    if (!query || query.length < 2) return { data: [], error: null };
    const res = await pool.query(
      "SELECT * FROM patients WHERE name ILIKE $1 OR dni ILIKE $1 LIMIT 10",
      [`%${query}%`]
    );
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function mergePatients(keepId: string, mergeId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Mover ingresos y resultados médicos
    await client.query('UPDATE appointments SET patient_id = $1 WHERE patient_id = $2', [keepId, mergeId]);
    await client.query('UPDATE medical_results SET patient_id = $1 WHERE patient_id = $2', [keepId, mergeId]);

    // Eliminar el paciente duplicado
    await client.query('DELETE FROM patients WHERE id = $1', [mergeId]);

    await client.query('COMMIT');
    
    revalidatePath("/pacientes");
    revalidatePath("/pacientes/[id]", "page");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error merging patients:", error);
    return { error: error.message };
  } finally {
    client.release();
  }
}
