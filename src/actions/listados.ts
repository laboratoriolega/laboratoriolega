"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAction } from "./audit";

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
    const paciente = formData.get("paciente") as string;
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
