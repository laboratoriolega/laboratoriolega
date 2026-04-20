import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ docId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { docId } = await context.params;
    const res = await pool.query('SELECT document_url, filename FROM appointment_documents WHERE id = $1', [docId]);
    const row = res.rows[0];
    
    if (!row) {
      return new NextResponse('Not found', { status: 404 });
    }

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
        'Content-Disposition': `inline; filename="${row.filename || 'archivo'}"`,
      },
    });
  } catch (err) {
    console.error("Doc File API error:", err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
