"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function logAction(action: string, details: any = {}) {
  try {
    const session = await getSession() as any;
    if (!session) return;

    await pool.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)",
      [session.id, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Failed to log action:", error);
  }
}

export async function getAuditLogs() {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') {
      throw new Error("Unauthorized");
    }

    const res = await pool.query(`
      SELECT al.*, u.username, u.role
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
