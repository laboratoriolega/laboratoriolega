"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PAGE ERROR:", error);
  }, [error]);

  return (
    <div style={{ padding: "3rem", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#ef4444" }}>Ocurrió un error renderizando esta vista</h2>
      <pre style={{ margin: "1rem auto", background: "#f1f5f9", padding: "1rem", borderRadius: "8px", maxWidth: "600px", whiteSpace: "pre-wrap", color: "#334155", textAlign: "left", fontSize: "0.85rem" }}>
        {error.message || "Error desconocido del framework SSR."}
      </pre>
      <button onClick={() => reset()} style={{ padding: "0.75rem 1.5rem", background: "#0ea5e9", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
        Intentar de nuevo
      </button>
    </div>
  );
}
