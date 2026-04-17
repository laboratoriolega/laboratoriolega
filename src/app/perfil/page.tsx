"use client";

import { useState, useEffect } from "react";
import { UserCircle, Key, Save, CheckCircle } from "lucide-react";
import { updateProfile } from "@/actions/users";

export default function PerfilPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);
    
    if (res.success) {
      setMessage({ type: 'success', text: "¡Perfil actualizado correctamente!" });
    } else {
      setMessage({ type: 'error', text: res.error || "Error al actualizar" });
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto',
          color: 'white'
        }}>
          <UserCircle size={48} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mi Perfil</h2>
        <p style={{ color: 'var(--text-muted)' }}>Configurá tu nombre público y contraseña de acceso.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {message && (
          <div style={{ 
            padding: '1rem', borderRadius: '8px', fontSize: '0.9rem',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <CheckCircle size={18} /> {message.text}
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Nombre Completo</label>
          <input name="full_name" required className="input-field" placeholder="Tu nombre y apellido" />
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key size={18} color="var(--accent)" /> Cambiar Contraseña
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Dejá este campo vacío si NO deseás cambiar tu contraseña actual.
          </p>
          <input 
            name="password" 
            type="password" 
            className="input-field" 
            placeholder="Nueva contraseña (mín. 6 caracteres)" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary" 
          style={{ width: "100%", padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}
        >
          {loading ? "Guardando..." : <><Save size={20} /> Guardar Cambios</>}
        </button>
      </form>
    </div>
  );
}
