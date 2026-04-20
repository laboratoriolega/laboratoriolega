"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAction } from "./audit";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

export async function getProfileData() {
  try {
    const session = await getSession() as any;
    if (!session) return { data: null, error: "Not authenticated" };

    const res = await pool.query("SELECT id, username, full_name, role, avatar_url FROM users WHERE id = $1", [session.id]);
    return { data: res.rows[0], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

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
    const avatarFile = formData.get("avatar") as File;

    // Ensure avatar_url column exists
    try {
      await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
    } catch (e) { /* ignore pg errors related to migration */ }

    let avatarUrl = null;
    if (avatarFile && avatarFile.size > 0) {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const filename = `avatars/${session.id}-${Date.now()}.${ext}`;
      // Switch to private for private stores
      const blob = await put(filename, avatarFile, { access: 'private' });
      avatarUrl = blob.url;
    }

    let query = "UPDATE users SET ";
    const params = [];
    let count = 1;

    if (full_name && full_name.trim().length > 0) {
      query += `full_name = $${count++}, `;
      params.push(full_name);
    }

    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      query += `password_hash = $${count++}, `;
      params.push(hashedPassword);
    }

    if (avatarUrl) {
      query += `avatar_url = $${count++}, `;
      params.push(avatarUrl);
    }

    // Remove last comma and space
    if (params.length === 0) {
      return { success: true, message: "No change" };
    }

    query = query.slice(0, -2) + ` WHERE id = $${count}`;
    params.push(session.id);

    await pool.query(query, params);
    await logAction("UPDATE_PROFILE_REFINED", { full_name_provided: !!full_name, avatar_updated: !!avatarUrl });

    revalidatePath("/perfil");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { error: error.message };
  }
}

export async function deleteUser(userId: number) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Unauthorized");
    if (session.id === userId) throw new Error("No podés eliminarte a vos mismo");

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

export async function updateUser(formData: FormData) {
  try {
    const session = await getSession() as any;
    if (!session || session.role !== 'admin') throw new Error("Acceso denegado: Se requieren permisos de administrador.");

    const id = formData.get("id");
    const username = formData.get("username") as string;
    const full_name = formData.get("full_name") as string;
    const role = formData.get("role") as string;
    const newPassword = formData.get("password") as string;

    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        "UPDATE users SET username = $1, full_name = $2, role = $3, password_hash = $4 WHERE id = $5",
        [username, full_name, role, hashedPassword, id]
      );
      await logAction("ADMIN_UPDATE_USER_AND_PWD", { user_id: id, username, role, updated_by: session.username });
    } else {
      await pool.query(
        "UPDATE users SET username = $1, full_name = $2, role = $3 WHERE id = $4",
        [username, full_name, role, id]
      );
      await logAction("ADMIN_UPDATE_USER", { user_id: id, username, role, updated_by: session.username });
    }

    revalidatePath("/usuarios");
    return { success: true };
  } catch (error: any) {
    console.error("Update user error:", error);
    return { error: error.message };
  }
}
