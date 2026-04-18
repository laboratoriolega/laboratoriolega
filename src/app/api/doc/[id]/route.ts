import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Require auth to view documents
    const session = await getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await context.params;
    const res = await pool.query('SELECT document_url, document_base64 FROM appointments WHERE id = $1', [id]);
    const row = res.rows[0];
    
    if (!row) {
      return new NextResponse('Not found', { status: 404 });
    }

    // New path: proxy the private Vercel Blob through the server
    if (row.document_url) {
      const blobRes = await fetch(row.document_url, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      });

      if (!blobRes.ok) {
        return new NextResponse('Failed to fetch document', { status: 502 });
      }

      const contentType = blobRes.headers.get('content-type') || 'application/octet-stream';
      const buffer = await blobRes.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="pedido-${id}"`,
        },
      });
    }

    // Legacy path: serve old base64 data
    if (row.document_base64) {
      const buffer = Buffer.from(row.document_base64, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `inline; filename="pedido-${id}.pdf"`,
        },
      });
    }

    return new NextResponse('Not found', { status: 404 });
  } catch (err) {
    console.error("Doc API error:", err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
