"use client";

import { useState } from "react";
import { UserPlus, X, Shield, User } from "lucide-react";
import { createUser } from "@/actions/users";

export default function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createUser(formData);
    if (!res.error) {
      setIsOpen(false);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <UserPlus size={18} /> Nuevo Usuario
    </button>
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyItems: "center", zIndex: 1000,
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        background: "var(--glass-bg)", width: "100%", maxWidth: "450px",
        borderRadius: "16px", boxShadow: "var(--glass-shadow)",
        overflow: "hidden", border: "1px solid var(--glass-border)", margin: "auto", position: "relative"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-gradient-end)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "var(--text-main)" }}>
            <UserPlus size={18} color="var(--primary)" /> Nuevo Usuario
          </h3>
          <button onClick={() => setIsOpen(false)} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Usuario (Login)</label>
            <input name="username" required className="input-field" placeholder="ej: jdoe" />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Nombre Completo</label>
            <input name="full_name" required className="input-field" placeholder="ej: Juan Pérez" />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>Contraseña Temporal</label>
            <input name="password" type="password" required className="input-field" placeholder="******" />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>Rol / Permisos</label>
            <select name="role" required className="input-field">
              <option value="administracion">Administración (Secretaría)</option>
              <option value="doctor">Doctor / Técnico</option>
              <option value="admin">Administrador (Control Total)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: "100%", padding: "1rem", marginTop: "0.5rem", fontSize: "1rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creando..." : "Registrar en el Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
