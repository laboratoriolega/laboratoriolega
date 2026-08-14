"use client";

import { useState, useRef } from "react";
import { X, Save, User as UserIcon, Calendar, Phone, Mail } from "lucide-react";
import { updatePatient } from "@/actions/patients";
import { getObrasSociales } from "@/actions/listados";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export default function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Health insurance list management
  const initialList: string[] = patient.health_insurance_list && patient.health_insurance_list.length > 0
    ? patient.health_insurance_list
    : (patient.health_insurance ? [patient.health_insurance] : []);

  const [insuranceList, setInsuranceList] = useState<string[]>(initialList);
  const [removedList, setRemovedList] = useState<string[]>([]);

  function handleAddInsurance(ins: string) {
    const trimmed = ins.trim();
    if (!trimmed || insuranceList.includes(trimmed)) return;
    setInsuranceList(prev => [trimmed, ...prev]);
    // If it was previously removed and re-added, unmark it
    setRemovedList(prev => prev.filter(r => r !== trimmed));
  }

  function handleRemoveInsurance(ins: string) {
    setInsuranceList(prev => prev.filter(i => i !== ins));
    setRemovedList(prev => [...prev, ins]);
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("id", patient.id);

    // Send the full list and removed list for the server to sync
    formData.set("health_insurance_list", insuranceList.join("|||"));
    formData.set("health_insurance_removed", removedList.join("|||"));
    // patients.health_insurance = first item in list (last known)
    formData.set("health_insurance", insuranceList[0] || "");

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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px",
    border: "1px solid var(--glass-border)", background: "var(--input-bg, rgba(255,255,255,0.05))",
    color: "var(--text-main)", fontSize: "0.88rem", outline: "none"
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem', animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px', maxHeight: '90vh', background: 'var(--glass-bg)',
        overflowY: 'auto', position: 'relative', animation: 'slideUp 0.3s ease',
        borderRadius: '20px', border: '1px solid var(--glass-border)'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--glass-bg)', zIndex: 10, backdropFilter: 'blur(10px)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Editar Paciente</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modificá los datos de {patient.name}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}><X size={20} /></button>
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
                <input name="email" type="text" defaultValue={patient.email} className="input-field" style={{ paddingLeft: '2.5rem' }} />
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

          {/* ── Obras Sociales ────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Obras Sociales del Paciente</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Listado histórico — el primero es el predeterminado en nuevos ingresos
                </p>
              </div>
            </div>

            {/* Chips of existing insurances */}
            {insuranceList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {insuranceList.map((ins, idx) => (
                  <span
                    key={ins}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.25rem 0.55rem 0.25rem 0.7rem',
                      borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                      background: idx === 0 ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${idx === 0 ? 'rgba(14,165,233,0.4)' : 'var(--glass-border)'}`,
                      color: idx === 0 ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >
                    {idx === 0 && <span style={{ fontSize: '0.65rem', opacity: 0.7, marginRight: '0.1rem' }}>★</span>}
                    {ins}
                    <button
                      type="button"
                      onClick={() => handleRemoveInsurance(ins)}
                      title="Quitar del perfil"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', opacity: 0.6 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new OS */}
            <AddInsuranceField onAdd={handleAddInsurance} existingList={insuranceList} />

            {/* Hidden fields to transmit the list to the server */}
            <input type="hidden" name="health_insurance_list" value={insuranceList.join("|||")} />
            <input type="hidden" name="health_insurance_removed" value={removedList.join("|||")} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Subcomponent: add a new OS to the patient profile ──────────────────────
function AddInsuranceField({ onAdd, existingList }: { onAdd: (ins: string) => void; existingList: string[] }) {
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [showDrop, setShowDrop] = useState(false);

  // Load options once on mount
  useState(() => {
    import("@/actions/listados").then(m => m.getObrasSociales()).then(res => {
      if (res.data) setOptions(res.data.filter((o: any) => o.activo).map((o: any) => o.nombre));
    });
  });

  const filtered = options.filter(o =>
    !existingList.includes(o) && (value.trim() === '' || o.toLowerCase().includes(value.toLowerCase()))
  );

  function add(ins: string) {
    const t = ins.trim();
    if (!t) return;
    onAdd(t);
    setValue("");
    setShowDrop(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
        Agregar obra social al perfil:
      </label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(value); } }}
            placeholder="Ej: PAMI, OSDE, Particular..."
            autoComplete="off"
            style={{
              width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
              border: '1px solid var(--glass-border)', background: 'var(--input-bg, rgba(255,255,255,0.05))',
              color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
            }}
          />
          {showDrop && filtered.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 600,
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              maxHeight: '180px', overflowY: 'auto'
            }}>
              {filtered.map(opt => (
                <div
                  key={opt}
                  onMouseDown={e => { e.preventDefault(); add(opt); }}
                  style={{ padding: '0.5rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)' }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => add(value)}
          style={{
            padding: '0.55rem 1rem', background: 'rgba(14,165,233,0.12)', color: 'var(--primary)',
            border: '1px solid rgba(14,165,233,0.3)', borderRadius: '8px', fontWeight: 700,
            fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap'
          }}
        >
          + Agregar
        </button>
      </div>
      <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        Escribí y presioná Enter o hacé clic en &quot;Agregar&quot;, luego guardá los cambios.
      </p>
    </div>
  );
}
