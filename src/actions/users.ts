"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAction } from "./audit";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Unauthorized");

    const res = await pool.query("SELECT id, username, role, full_name FROM users ORDER BY username ASC");
    return { data: res.rows, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createUser(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Unauthorized");

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const full_name = formData.get("full_name") as string;

    const hashedPassword = await bcrypt.hash(password, 10);

    const res = await pool.query(
      "INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id",
      [username, hashedPassword, role, full_name]
    );

    await logAction("CREATE_USER", { username, role, full_name, created_by: session.username });
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { error: error.message };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session) throw new Error("Not authenticated");

    const full_name = formData.get("full_name") as string;
    const newPassword = formData.get("password") as string;

    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        "UPDATE users SET full_name = $1, password_hash = $2 WHERE id = $3",
        [full_name, hashedPassword, session.id]
      );
      await logAction("UPDATE_PROFILE_WITH_PASSWORD", { full_name });
    } else {
      await pool.query(
        "UPDATE users SET full_name = $1 WHERE id = $2",
        [full_name, session.id]
      );
      await logAction("UPDATE_PROFILE_NAME", { full_name });
    }

    revalidatePath("/perfil");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteUser(userId: number) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Unauthorized");
    if (session.id === userId) throw new Error("Cannot delete yourself");

    const userRes = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
    const targetUsername = userRes.rows[0]?.username;

    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    
    await logAction("DELETE_USER", { userId, username: targetUsername, deleted_by: session.username });
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
