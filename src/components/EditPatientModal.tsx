"use client";

import { useState } from "react";
import { X, Save, User as UserIcon, Calendar, Phone, Mail, Shield } from "lucide-react";
import { updatePatient } from "@/actions/patients";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export default function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("id", patient.id);

    try {
      const res = await updatePatient(formData);
      if (res.error) {
        setError(res.error);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem', animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '500px', background: 'var(--glass-bg)',
        overflow: 'hidden', position: 'relative', animation: 'slideUp 0.3s ease'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Editar Paciente</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modificá los datos de {patient.name}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: 'var(--danger)', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input name="name" defaultValue={patient.name} required className="input-field" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>DNI</label>
              <input name="dni" defaultValue={patient.dni} required className="input-field" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Teléfono</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input name="phone" defaultValue={patient.phone} className="input-field" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input name="email" type="email" defaultValue={patient.email} className="input-field" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Obra Social</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input name="health_insurance" defaultValue={patient.health_insurance} className="input-field" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Fecha Nacimiento</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input 
                  name="birth_date" 
                  type="date" 
                  defaultValue={patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : ''} 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', fontWeight: 600 }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
