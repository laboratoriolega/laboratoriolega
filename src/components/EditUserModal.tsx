"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/actions/users";
import { X, User, Shield, Loader2, UserCog } from "lucide-react";

export default function EditUserModal({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen || !user) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", user.id);
    
    try {
      const res = await updateUser(formData);
      if (res.error) {
        alert(res.error);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      alert("Error al actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "0.9rem",
    color: "#1e293b",
    outline: "none"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.25rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#64748b"
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        background: "var(--glass-bg)", width: "100%", maxWidth: "450px",
        borderRadius: "16px", boxShadow: "var(--glass-shadow)",
        overflow: "hidden", border: "1px solid var(--glass-border)"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-gradient-end)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "var(--text-main)" }}>
            <UserCog size={18} color="var(--primary)" /> Editar Usuario
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Nombre de Usuario</label>
            <input required name="username" defaultValue={user.username} type="text" className="input-field" />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Nombre Completo</label>
            <input name="full_name" required defaultValue={user.full_name} className="input-field" />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Rol</label>
            <select name="role" defaultValue={user.role} className="input-field">
              <option value="user">Usuario (Lectura/Carga)</option>
              <option value="admin">Administrador (Total)</option>
            </select>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Nueva Contraseña (Opcional)</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Dejar en blanco para mantener la actual.</p>
            <input name="password" type="password" className="input-field" placeholder="••••••••" />
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", background: "#f1f5f9", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "0.75rem", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
              {loading ? <Loader2 className="animate-spin" /> : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
