import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const res = await pool.query('SELECT document_base64 FROM appointments WHERE id = $1', [id]);
    const { document_base64 } = res.rows[0] || {};
    
    if (!document_base64) {
      return new NextResponse('Not found', { status: 404 });
    }

    const buffer = Buffer.from(document_base64, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream', // Puede ser PDF o Imagen
        'Content-Disposition': `inline; filename="pedido-${id}.pdf"`,
      },
    });
  } catch (err) {
    return new NextResponse('Internal error', { status: 500 });
  }
}
