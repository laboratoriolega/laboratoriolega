"use client";

import { useState, useEffect, useRef } from "react";
import { UserCircle, Key, Save, CheckCircle, Camera, Loader2 } from "lucide-react";
import { updateProfile, getProfileData } from "@/actions/users";

export default function PerfilPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const res = await getProfileData();
      if (res.data) {
        setUser(res.data);
        if (res.data.avatar_url) setPreview(res.data.avatar_url);
      }
      setInitialLoading(false);
    }
    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);
    
    if (res.success) {
      setMessage({ type: 'success', text: "¡Perfil actualizado correctamente!" });
      // Reload to ensure all components see the change
      window.location.reload();
    } else {
      setMessage({ type: 'error', text: res.error || "Error al actualizar" });
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem auto' }}>
          <div style={{ 
            width: '100%', height: '100%', background: 'var(--primary)', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {preview ? (
              <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserCircle size={80} />
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              position: 'absolute', bottom: '5px', right: '5px', 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: 'var(--primary)', color: 'white', border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <Camera size={18} />
          </button>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{user?.full_name || 'Mi Perfil'}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>@{user?.username}</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <input 
          type="file" 
          name="avatar" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
        
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
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: 'var(--text-main)' }}>Nombre Completo</label>
          <input 
            name="full_name" 
            required 
            className="input-field" 
            placeholder="Tu nombre y apellido" 
            defaultValue={user?.full_name}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)' }}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
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
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary" 
          style={{ 
            width: "100%", padding: '1rem', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', gap: '0.5rem', fontSize: '1rem',
            background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px',
            cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(14, 165, 233, 0.2)'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Guardar Cambios</>}
        </button>
      </form>
    </div>
  );
}
