"use server";

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPatients() {
  try {
    const res = await pool.query('SELECT * FROM patients ORDER BY name ASC');
    return { 
      data: res.rows.map(row => ({
        ...row,
        birth_date: row.birth_date ? new Date(row.birth_date).toISOString() : null
      })), 
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return { data: null, error: error.message };
  }
}

export async function updatePatient(formData: FormData) {
  try {
    const id = formData.get("id");
    const name = formData.get("name") as string;
    const dni = formData.get("dni") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const health_insurance = formData.get("health_insurance") as string;
    const birth_date = formData.get("birth_date") as string;

    await pool.query(
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

    revalidatePath("/pacientes");
    revalidatePath("/pacientes/[id]", "page");
    revalidatePath("/");
    revalidatePath("/calendario");
    
    return { success: true };
  } catch (error: any) {
    console.error("Update patient error:", error);
    return { error: error.message };
  }
}
