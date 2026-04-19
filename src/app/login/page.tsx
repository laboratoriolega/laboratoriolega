"use client";
import { useState } from "react";
import { login } from "@/actions/auth";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await login(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div style={{
      width: "100%", maxWidth: "400px", padding: "2.5rem",
      background: "var(--glass-bg)", backdropFilter: "blur(16px)",
      borderRadius: "20px", boxShadow: "var(--glass-shadow)",
      border: "1px solid var(--glass-border)"
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img src="/logo.png" alt="LEGA" className="logo-light" style={{ height: "60px", marginBottom: "1rem" }} />
        <img src="/logoB.png" alt="LEGA" className="logo-dark" style={{ height: "60px", marginBottom: "1rem" }} />
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)" }}>Portal de Acceso</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Ingresa tus credenciales para continuar</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", textAlign: "center", fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)" }}>Usuario / Role</label>
          <input 
            required 
            name="username" 
            type="text" 
            className="input-field" 
            placeholder="Ej: admin"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)" }}>Contraseña</label>
          <input 
            required 
            name="password" 
            type="password" 
            className="input-field" 
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary" 
          style={{ padding: "0.875rem", marginTop: "0.5rem", fontSize: "1rem", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Autenticando..." : "Ingresar Seguro"}
        </button>
      </form>
    </div>
  );
}
