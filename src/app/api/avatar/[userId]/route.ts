import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId } = await context.params;
    
    // Fetch the avatar_url for this user
    const res = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    const row = res.rows[0];
    
    if (!row || !row.avatar_url) {
      return new NextResponse('Not found', { status: 404 });
    }

    const blobRes = await fetch(row.avatar_url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!blobRes.ok) {
      console.error(`Failed to fetch avatar from Vercel Blob: ${blobRes.status} ${blobRes.statusText}`);
      return new NextResponse('Failed to fetch avatar', { status: 502 });
    }

    const contentType = blobRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await blobRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error("Avatar API error:", err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
