"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CRITICAL LAYOUT ERROR:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#ef4444" }}>Ocurrió un error grave en la raíz del sistema</h2>
          <pre style={{ margin: "1rem auto", background: "#f1f5f9", padding: "1rem", borderRadius: "8px", maxWidth: "600px", whiteSpace: "pre-wrap", color: "#334155", textAlign: "left", fontSize: "0.85rem" }}>
            {error.message || "Crashed without message. Check Vercel Logs."}
          </pre>
          <button onClick={() => window.location.href = '/'} style={{ padding: "0.75rem 1.5rem", background: "#0ea5e9", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Reiniciar Sistema Frontal
          </button>
        </div>
      </body>
    </html>
  );
}
