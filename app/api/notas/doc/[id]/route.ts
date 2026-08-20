import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const res = await pool.query("SELECT url, filename FROM notas_ws_documents WHERE id = $1", [id]);
    
    if (res.rows.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const docUrl = res.rows[0].url;
    
    if (!docUrl) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Proxy the request to Vercel Blob with the correct read token
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
       console.warn("BLOB_READ_WRITE_TOKEN no configurado");
    }
    
    const response = await globalThis.fetch(docUrl, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });

    if (!response.ok) {
      return new NextResponse("Error fetching document from storage", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    const newHeaders = new Headers(response.headers);
    newHeaders.set("Content-Type", contentType);
    newHeaders.set("Content-Disposition", `inline; filename="${res.rows[0].filename}"`);

    return new NextResponse(response.body as any, {
      status: 200,
      headers: newHeaders,
    });
  } catch (error: any) {
    console.error("Error fetching doc:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
