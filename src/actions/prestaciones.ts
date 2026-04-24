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
    const res = await query(
      "SELECT id, sheet_name, row_data, row_index FROM prestaciones_data WHERE sheet_name = $1 ORDER BY row_index ASC",
      [sheetName]
    );
    return { success: true, data: res.rows };
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
    // revalidatePath("/prestaciones");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating prestacion:", error);
    return { success: false, error: error.message };
  }
}

export async function addPrestacion(sheetName: string, rowData: any, afterId?: number) {
  try {
    let nextIndex;
    if (afterId) {
      // Find the index of the row to insert after
      const afterRowRes = await query("SELECT row_index FROM prestaciones_data WHERE id = $1", [afterId]);
      const currentIdx = afterRowRes.rows[0]?.row_index ?? 0;

      // Shift all subsequent indices
      await query(
        "UPDATE prestaciones_data SET row_index = row_index + 1 WHERE sheet_name = $1 AND row_index > $2",
        [sheetName, currentIdx]
      );
      nextIndex = currentIdx + 1;
    } else {
      // Get max index for this sheet
      const maxIndexRes = await query(
        "SELECT MAX(row_index) as max_idx FROM prestaciones_data WHERE sheet_name = $1",
        [sheetName]
      );
      nextIndex = (maxIndexRes.rows[0].max_idx ?? -1) + 1;
    }

    const insertRes = await query(
      "INSERT INTO prestaciones_data (sheet_name, row_data, row_index) VALUES ($1, $2, $3) RETURNING *",
      [sheetName, JSON.stringify(rowData), nextIndex]
    );
    return { success: true, data: insertRes.rows[0] };
  } catch (error: any) {
    console.error("Error adding prestacion:", error);
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
