"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getPrestacionesSheets() {
  try {
    const res = await query(
      "SELECT DISTINCT sheet_name FROM prestaciones_data ORDER BY sheet_name ASC"
    );
    return { success: true, data: res.rows.map((r: any) => r.sheet_name) };
  } catch (error: any) {
    console.error("Error fetching sheet names:", error);
    return { success: false, error: error.message };
  }
}

export async function getPrestacionesBySheet(sheetName: string) {
  try {
    const sectionsRes = await query(
      "SELECT * FROM prestaciones_sections WHERE sheet_name = $1 ORDER BY row_index ASC",
      [sheetName]
    );

    const rowsRes = await query(
      "SELECT id, sheet_name, row_data, row_index, section_id FROM prestaciones_data WHERE sheet_name = $1 ORDER BY row_index ASC",
      [sheetName]
    );

    return { 
      success: true, 
      sections: sectionsRes.rows,
      rows: rowsRes.rows 
    };
  } catch (error: any) {
    console.error("Error fetching sheet data:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePrestacion(id: number, rowData: any) {
  try {
    await query(
      "UPDATE prestaciones_data SET row_data = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(rowData), id]
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error updating prestacion:", error);
    return { success: false, error: error.message };
  }
}

export async function addPrestacion(sheetName: string, rowData: any, sectionId: number) {
  try {
    const maxIndexRes = await query(
      "SELECT MAX(row_index) as max_idx FROM prestaciones_data WHERE sheet_name = $1",
      [sheetName]
    );
    const nextIndex = (maxIndexRes.rows[0].max_idx ?? -1) + 1;

    await query(
      "INSERT INTO prestaciones_data (sheet_name, row_data, row_index, section_id) VALUES ($1, $2, $3, $4)",
      [sheetName, JSON.stringify(rowData), nextIndex, sectionId]
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error adding prestacion:", error);
    return { success: false, error: error.message };
  }
}

export async function addPrestacionSection(sheetName: string, title: string, subtitle?: string, headers?: string[]) {
  try {
    const maxIndexRes = await query(
      "SELECT MAX(row_index) as max_idx FROM prestaciones_sections WHERE sheet_name = $1",
      [sheetName]
    );
    const nextIndex = (maxIndexRes.rows[0].max_idx ?? -1) + 1;

    const res = await query(
      "INSERT INTO prestaciones_sections (sheet_name, title, subtitle, headers, row_index) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [sheetName, title, subtitle, JSON.stringify(headers || []), nextIndex]
    );
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    console.error("Error adding section:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePrestacion(id: number) {
  try {
    await query("DELETE FROM prestaciones_data WHERE id = $1", [id]);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting prestacion:", error);
    return { success: false, error: error.message };
  }
}
