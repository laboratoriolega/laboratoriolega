"use server";
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) return { error: "Por favor, ingresa tus credenciales." };

  try {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return { error: "Usuario o contraseña incorrectos." };
    }
    
    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      return { error: "Usuario o contraseña incorrectos." };
    }

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return { success: true };
  } catch (error: any) {
    console.error("Login error:", error);
    return { error: "Error interno del servidor. Por favor, intenta de nuevo." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
