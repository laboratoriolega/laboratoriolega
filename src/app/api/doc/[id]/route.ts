import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const res = await pool.query('SELECT document_url, document_base64 FROM appointments WHERE id = $1', [id]);
    const row = res.rows[0];
    
    if (!row) {
      return new NextResponse('Not found', { status: 404 });
    }

    // New path: redirect to Vercel Blob CDN URL
    if (row.document_url) {
      return NextResponse.redirect(row.document_url);
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
