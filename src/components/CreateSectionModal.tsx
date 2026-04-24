"use client";

import { useState } from "react";
import { X, Plus, Trash2, Hash, Type, DollarSign } from "lucide-react";

interface CreateSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, subtitle: string, columns: Array<{ name: string, type: string }>) => void;
}

export default function CreateSectionModal({ isOpen, onClose, onSubmit }: CreateSectionModalProps) {
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [columns, setColumns] = useState([
        { name: "Prestaciones", type: "text" },
        { name: "Costo Interno", type: "price" },
        { name: "Costo", type: "price" },
        { name: "Tiempo de demora estimado", type: "text" }
    ]);

    if (!isOpen) return null;

    const handleAddColumn = () => setColumns([...columns, { name: "", type: "text" }]);
    const handleRemoveColumn = (idx: number) => setColumns(columns.filter((_, i) => i !== idx));

    const handleColumnChange = (idx: number, field: "name" | "type", val: string) => {
        const newCols = [...columns];
        newCols[idx] = { ...newCols[idx], [field]: val };
        setColumns(newCols);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return alert("El título es obligatorio");
        const validCols = columns.filter(c => c.name.trim() !== "");
        if (validCols.length === 0) return alert("Debe haber al menos una columna");
        onSubmit(title, subtitle, validCols);
        setTitle("");
        setSubtitle("");
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '700px', width: '95%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>Cargar nuevo Convenio Particular</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                placeholder="Ej: Valores Mayo 2026"
                                value={subtitle}
                                onChange={e => setSubtitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            Definición de Columnas y Tipos
                            <button type="button" onClick={handleAddColumn} className="btn-small">
                                <Plus size={14} /> Nueva Columna
                            </button>
                        </label>
                        <div className="columns-grid">
                            {columns.map((col, idx) => (
                                <div key={idx} className="column-row">
                                    <input
                                        type="text"
                                        className="modern-input col-name"
                                        value={col.name}
                                        onChange={e => handleColumnChange(idx, "name", e.target.value)}
                                        placeholder="Nombre de columna"
                                    />
                                    <div className="type-selector">
                                        <select
                                            value={col.type}
                                            onChange={e => handleColumnChange(idx, "type", e.target.value)}
                                            className="modern-select"
                                        >
                                            <option value="text">Texto</option>
                                            <option value="number">Numérico</option>
                                            <option value="price">Precio ($)</option>
                                        </select>
                                        <div className="type-icon">
                                            {col.type === "text" && <Type size={14} />}
                                            {col.type === "number" && <Hash size={14} />}
                                            {col.type === "price" && <DollarSign size={14} />}
                                        </div>
                                    </div>
                                    {columns.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveColumn(idx)} className="btn-delete">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}>
                            Crear Tabla Configurada
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 1000; padding: 1rem;
                }
                .modal-content {
                    background: white; padding: 2rem; border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.025em; }
                .modern-input {
                    background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
                    padding: 0.75rem 1rem; font-size: 0.95rem; transition: all 0.2s;
                }
                .modern-input:focus { border-color: var(--primary); outline: none; background: white; box-shadow: 0 0 0 4px rgba(14,165,233,0.1); }
                
                .columns-grid {
                    display: flex; flex-direction: column; gap: 0.75rem;
                    max-height: 350px; overflow-y: auto; padding-right: 0.5rem;
                }
                .column-row { display: flex; gap: 0.75rem; align-items: center; }
                .col-name { flex: 1; }
                
                .type-selector { position: relative; width: 140px; }
                .modern-select {
                    width: 100%; appearance: none; background: #f1f5f9; border: 1.5px solid #e2e8f0;
                    border-radius: 10px; padding: 0.5rem 0.75rem 0.5rem 2rem;
                    font-size: 0.85rem; font-weight: 600; cursor: pointer; color: #475569;
                }
                .type-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--primary); pointer-events: none; }
                
                .btn-delete { background: #fff1f2; color: #e11d48; border: none; padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
                .btn-delete:hover { background: #fee2e2; transform: scale(1.1); }
                
                .btn-small {
                    display: flex; align-items: center; gap: 0.25rem;
                    background: #f0f9ff; color: #0369a1; border: none; padding: 0.4rem 0.8rem;
                    border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer;
                }
                .btn-primary { background: var(--primary); color: white; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(14,165,233,0.4); }
                
                .glass-panel { background: rgba(255, 255, 255, 0.98); border: 1px solid #e2e8f0; }
            `}</style>
        </div>
    );
}
