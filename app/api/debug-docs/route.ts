import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const res = await pool.query('SELECT id, document_url FROM appointment_documents WHERE document_url IS NOT NULL LIMIT 5');
    const results = [];

    for (const doc of res.rows) {
      console.log(`Checking doc ${doc.id}: ${doc.document_url}`);
      try {
        const fetchStart = Date.now();
        const blobRes = await fetch(doc.document_url, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });
        const duration = Date.now() - fetchStart;

        results.push({
          id: doc.id,
          url: doc.document_url,
          status: blobRes.status,
          ok: blobRes.ok,
          duration: `${duration}ms`,
          tokenPreview: process.env.BLOB_READ_WRITE_TOKEN ? `${process.env.BLOB_READ_WRITE_TOKEN.slice(0, 15)}...` : 'MISSING'
        });
      } catch (err) {
        results.push({
          id: doc.id,
          url: doc.document_url,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      database: process.env.DATABASE_URL?.split('@')[1] || 'Unknown',
      results
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
