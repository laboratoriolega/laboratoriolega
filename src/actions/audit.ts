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

export async function getAuditLogs(filters: { period?: string, date?: string } = {}) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') {
      throw new Error("Unauthorized");
    }

    let query = `
      SELECT al.*, u.username, u.role
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
    `;
    const params: any[] = [];

    if (filters.period === 'week') {
      query += " WHERE al.created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '7 days'";
    } else if (filters.period === 'month') {
       query += " WHERE al.created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'";
    } else if (filters.period === 'date' && filters.date) {
      query += " WHERE DATE(al.created_at) = $1";
      params.push(filters.date);
    }

    query += " ORDER BY al.created_at DESC LIMIT 200";

    const res = await pool.query(query, params);
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
