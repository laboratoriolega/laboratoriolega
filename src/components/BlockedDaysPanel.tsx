"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale/es';
import { Ban, Trash2, Plus, Loader2, Edit2, Check, X } from "lucide-react";
import { createBlockedDay, deleteBlockedDay, updateBlockedDay } from "@/actions/appointments";
import { useRouter } from "next/navigation";

type BlockedDay = { id: number; fecha: string; descripcion: string | null };

export default function BlockedDaysPanel({ blockedDays: initial }: { blockedDays: BlockedDay[] }) {
  const router = useRouter();
  const [days, setDays] = useState<BlockedDay[]>(initial);
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => { setDays(initial); }, [initial]);

  async function handleAdd() {
    if (!newDate) return;
    setSaving(true);
    const res = await createBlockedDay(newDate, newDesc);
    if (!res.error) {
      setNewDate('');
      setNewDesc('');
      router.refresh();
    } else {
      alert(res.error);
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este día bloqueado?")) return;
    setLoadingId(id);
    const res = await deleteBlockedDay(id);
    if (!res.error) {
      setDays(prev => prev.filter(d => d.id !== id));
      router.refresh();
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  }

  function startEdit(bd: BlockedDay) {
    setEditingId(bd.id);
    setEditDesc(bd.descripcion || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDesc('');
  }

  async function handleSaveEdit(id: number) {
    setLoadingId(id);
    const res = await updateBlockedDay(id, editDesc);
    if (!res.error) {
      setDays(prev => prev.map(d => d.id === id ? { ...d, descripcion: editDesc || null } : d));
      setEditingId(null);
      router.refresh();
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.7rem', borderRadius: '8px',
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '0.85rem', color: '#1e293b', outline: 'none',
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.3)' }}>
      <h4 style={{ margin: '0 0 1rem', color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
        <Ban size={15} /> Feriados / Días sin atención
      </h4>

      {/* Add row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Fecha</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ ...inputStyle, minWidth: '160px' }} />
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Descripción (opcional)</label>
          <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={inputStyle} placeholder="Ej: Feriado Nacional" />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !newDate}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !newDate ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Agregar
        </button>
      </div>

      {/* List */}
      {days.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No hay días bloqueados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...days].sort((a, b) => a.fecha.localeCompare(b.fecha)).map(bd => (
            <div key={bd.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: 'rgba(239,68,68,0.07)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {/* Date — fixed */}
              <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.88rem', whiteSpace: 'nowrap', minWidth: '140px' }}>
                {format(new Date(bd.fecha.slice(0, 10) + 'T12:00:00'), "dd 'de' MMMM yyyy", { locale: es })}
              </span>

              {/* Description — editable inline */}
              {editingId === bd.id ? (
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(bd.id); if (e.key === 'Escape') cancelEdit(); }}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Descripción..."
                />
              ) : (
                <span style={{ flex: 1, color: bd.descripcion ? 'var(--text-muted)' : 'rgba(0,0,0,0.25)', fontSize: '0.83rem', fontStyle: bd.descripcion ? 'normal' : 'italic' }}>
                  {bd.descripcion || 'Sin descripción'}
                </span>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                {editingId === bd.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(bd.id)}
                      disabled={loadingId === bd.id}
                      title="Guardar"
                      style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {loadingId === bd.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      title="Cancelar"
                      style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(bd)}
                      title="Editar descripción"
                      style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(bd.id)}
                      disabled={loadingId === bd.id}
                      title="Eliminar"
                      style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {loadingId === bd.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
