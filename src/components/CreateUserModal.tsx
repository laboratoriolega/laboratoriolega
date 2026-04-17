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
        background: "white", padding: "2rem", borderRadius: "20px",
        width: "100%", maxWidth: "450px", margin: "auto", position: "relative"
      }}>
        <button onClick={() => setIsOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)", padding: "0.5rem" }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={24} color="var(--primary)" /> Alta de Personal
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>Usuario (Login)</label>
            <input name="username" required className="input-field" placeholder="ej: jdoe" />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>Nombre Completo</label>
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
