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

export async function getAuditLogs(filters: { period?: string, date?: string, username?: string } = {}) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') {
      throw new Error("Unauthorized");
    }

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.period === 'week') {
      conditions.push(`al.created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '7 days'`);
    } else if (filters.period === 'month') {
      conditions.push(`al.created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'`);
    } else if (filters.period === 'date' && filters.date) {
      params.push(filters.date);
      conditions.push(`DATE(al.created_at) = $${params.length}`);
    }

    if (filters.username && filters.username !== 'all') {
      params.push(filters.username);
      conditions.push(`u.username = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT al.*, u.username, u.role
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ${where}
      ORDER BY al.created_at DESC LIMIT 200
    `;

    const res = await pool.query(query, params);
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getAuditUsers() {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Unauthorized");
    const res = await pool.query(`
      SELECT DISTINCT u.username FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY u.username ASC
    `);
    return { data: res.rows.map((r: any) => r.username), error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
