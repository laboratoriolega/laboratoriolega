import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return new NextResponse('URL faltante', { status: 400 });
    }

    // Security: Only allow URLs from Vercel Blob
    if (!url.includes('public.blob.vercel-storage.com')) {
      return new NextResponse('URL no permitida', { status: 403 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse('Error al recuperar el archivo', { status: response.status });
    }

    const blob = await response.blob();
    const headers = new Headers();
    
    // Pass along some basic headers
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) headers.set('content-disposition', contentDisposition);

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Document proxy error:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
