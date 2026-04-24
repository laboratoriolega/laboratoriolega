"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface CreateSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, subtitle: string, columns: string[]) => void;
}

export default function CreateSectionModal({ isOpen, onClose, onSubmit }: CreateSectionModalProps) {
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [columns, setColumns] = useState(["Prestaciones", "Costo Interno", "Costo", "Tiempo de demora estimado", "Tipo de Muestra"]);

    if (!isOpen) return null;

    const handleAddColumn = () => setColumns([...columns, ""]);
    const handleRemoveColumn = (idx: number) => setColumns(columns.filter((_, i) => i !== idx));
    const handleColumnChange = (idx: number, val: string) => {
        const newCols = [...columns];
        newCols[idx] = val;
        setColumns(newCols);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return alert("El título es obligatorio");
        onSubmit(title, subtitle, columns.filter(c => c.trim() !== ""));
        setTitle("");
        setSubtitle("");
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Cargar nuevo Convenio Particular</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Nombre del Laboratorio / Convenio</label>
                        <input
                            type="text"
                            className="modern-input"
                            placeholder="Ej: Laboratorio JUJUY"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Subtítulo / Período (Opcional)</label>
                        <input
                            type="text"
                            className="modern-input"
                            placeholder="Ej: Valores Abril 26 - Mayo 26"
                            value={subtitle}
                            onChange={e => setSubtitle(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Columnas de la Tabla
                            <button type="button" onClick={handleAddColumn} className="btn-small"><Plus size={14} /> Agregar Columna</button>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {columns.map((col, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.25rem' }}>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                                        value={col}
                                        onChange={e => handleColumnChange(idx, e.target.value)}
                                        placeholder="Nombre columna"
                                    />
                                    {columns.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveColumn(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Crear Convenio</button>
                    </div>
                </form>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .form-group { display: flex; flexDirection: column; gap: 0.4rem; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
        .modern-input {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .modern-input:focus { border-color: var(--primary); outline: none; background: white; }
        .btn-small {
          display: flex; align-items: center; gap: 0.25rem;
          background: rgba(14, 165, 233, 0.1);
          color: var(--primary);
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.8rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0,0,0,0.1);
        }
      `}</style>
        </div>
    );
}
