"use server";

import pool from '@/lib/db';

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
