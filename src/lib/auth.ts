import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { cache } from 'react';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'lega-super-secret-key-2026-fallback');

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (err) {
    return null;
  }
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  
  const payload = await verifyToken(token) as any;
  if (!payload || !payload.id) return null;

  try {
    // Fetch latest permissions from DB to ensure they are always up-to-date
    const res = await pool.query('SELECT custom_permissions FROM users WHERE id = $1', [payload.id]);
    if (res.rows.length > 0) {
      const dbPerms = res.rows[0].custom_permissions;
      payload.custom_permissions = typeof dbPerms === 'string' ? JSON.parse(dbPerms) : dbPerms;
    }
  } catch (e) {
    console.error("Error fetching latest permissions:", e);
  }

  return payload;
});
