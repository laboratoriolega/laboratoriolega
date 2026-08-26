"use client";

import { useState } from "react";
import { Search, Save, X, Plus, Trash2, Check, Settings, ArrowUp, ArrowDown } from "lucide-react";
import { createAnalisisLista, updateAnalisisLista, deleteAnalisisLista, updateAnalisisConfig } from "@/actions/listados";
import Portal from "./Portal";

interface Column {
  key: string;
  label: string;
}

export default function AnalisisExcelTable({ data, initialColumns, canEdit }: { data: any[], initialColumns: Column[], canEdit: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data.map(d => ({ id: d.id, ...d.data })));
  const [columns, setColumns] = useState<Column[]>(initialColumns || []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowValues, setNewRowValues] = useState<any>({});
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingColumns, setEditingColumns] = useState<Column[]>([...columns]);

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return columns.some(col => item[col.key] && String(item[col.key]).toLowerCase().includes(term));
  });

  async function handleSave(id: number) {
    const res = await updateAnalisisLista(id, editValues);
    if (!res.error) {
      setItems(items.map((it: any) => it.id === id ? { ...it, ...editValues } : it));
      setEditingId(null);
    } else {
      alert(res.error);
    }
  }

  async function handleCreate() {
    const res = await createAnalisisLista(newRowValues);
    if (!res.error) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  function handleDelete(id: number) {
    setDeleteConfirmId(id);
  }

  async function executeDelete() {
    if (deleteConfirmId === null) return;
    const res = await deleteAnalisisLista(deleteConfirmId);
    if (!res.error) {
      setItems(items.filter((it: any) => it.id !== deleteConfirmId));
    }
    setDeleteConfirmId(null);
  }

  async function handleSaveConfig() {
    const res = await updateAnalisisConfig({ columns: editingColumns });
    if (!res.error) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  const renderCell = (item: any, field: string, placeholder: string = "-") => {
    if (!canEdit) {
      return <div>{item[field] || <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>{placeholder}</span>}</div>;
    }
    
    if (editingId === item.id) {
      return (
        <input 
          className="input-field" 
          defaultValue={item[field]} 
          onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
          style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--primary)", borderRadius: "4px" }}
        />
      );
    }
    return (
      <div 
        onClick={() => { setEditingId(item.id); setEditValues(item); }}
        style={{ cursor: "pointer", width: "100%", height: "100%", minHeight: "24px" }}
        title="Click para editar"
      >
        {item[field] || <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>{placeholder}</span>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div className="glass-panel" style={{ flex: 1, minWidth: "250px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Search size={20} style={{ color: "var(--text-muted)" }} />
          <input 
            className="input-field" 
            placeholder="Buscar en todas las celdas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", boxShadow: "none", padding: 0 }}
          />
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => { setEditingColumns([...columns]); setShowConfigModal(true); }} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
              <Settings size={18} /> Columnas
            </button>
            <button onClick={() => setShowNewRow(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
              <Plus size={18} /> Nueva Fila
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div className="table-responsive" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${Math.max(1000, columns.length * 150)}px` }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem", background: "var(--bg-gradient-end)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)" }}>{col.label}</th>
                ))}
                {canEdit && <th style={{ padding: "1rem", width: "80px", textAlign: "center" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {showNewRow && canEdit && (
                <tr style={{ borderBottom: "1px solid var(--glass-border)", background: "rgba(255, 255, 255, 0.05)" }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>
                      <input 
                        className="input-field" 
                        placeholder={col.label}
                        onChange={(e) => setNewRowValues({ ...newRowValues, [col.key]: e.target.value })}
                        style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--primary)", borderRadius: "4px" }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button onClick={handleCreate} style={{ color: "var(--success)" }} title="Guardar"><Check size={18} /></button>
                      <button onClick={() => setShowNewRow(false)} style={{ color: "var(--danger)" }} title="Cancelar"><X size={18} /></button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="hoverable-row" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                      {renderCell(item, col.key, `${col.label}...`)}
                    </td>
                  ))}
                  {canEdit && (
                    <td style={{ padding: "0.75rem", textAlign: "center", verticalAlign: "top" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => handleSave(item.id)} style={{ color: "var(--success)" }} title="Guardar"><Save size={18} /></button>
                            <button onClick={() => setEditingId(null)} title="Cancelar"><X size={18} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleDelete(item.id)} style={{ color: "var(--danger)" }} title="Eliminar"><Trash2 size={18} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredItems.length === 0 && !showNewRow && (
                <tr>
                  <td colSpan={columns.length + (canEdit ? 1 : 0)} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No se encontraron análisis
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConfigModal && (
        <Portal>
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
            padding: "1rem"
          }}>
            <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0 }}>Configurar Columnas</h3>
                <button onClick={() => setShowConfigModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20}/></button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", maxHeight: "300px", overflowY: "auto" }}>
                {editingColumns.map((col, idx) => (
                  <div key={col.key} style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--glass-bg)", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <button disabled={idx === 0} onClick={() => {
                        const newCols = [...editingColumns];
                        [newCols[idx - 1], newCols[idx]] = [newCols[idx], newCols[idx - 1]];
                        setEditingColumns(newCols);
                      }} style={{ border: "none", background: "none", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}><ArrowUp size={14}/></button>
                      <button disabled={idx === editingColumns.length - 1} onClick={() => {
                        const newCols = [...editingColumns];
                        [newCols[idx + 1], newCols[idx]] = [newCols[idx], newCols[idx + 1]];
                        setEditingColumns(newCols);
                      }} style={{ border: "none", background: "none", cursor: idx === editingColumns.length - 1 ? "default" : "pointer", opacity: idx === editingColumns.length - 1 ? 0.3 : 1 }}><ArrowDown size={14}/></button>
                    </div>
                    <input 
                      value={col.label} 
                      onChange={(e) => {
                        const newCols = [...editingColumns];
                        newCols[idx].label = e.target.value;
                        setEditingColumns(newCols);
                      }}
                      className="input-field" 
                      style={{ flex: 1 }}
                    />
                    <button onClick={() => {
                      setEditingColumns(editingColumns.filter((_, i) => i !== idx));
                    }} style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", border: "none", padding: "0.5rem", borderRadius: "6px", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => {
                const newKey = `col_${Date.now()}`;
                setEditingColumns([...editingColumns, { key: newKey, label: "Nueva Columna" }]);
              }} className="btn-secondary" style={{ width: "100%", marginBottom: "1.5rem" }}>
                <Plus size={18}/> Agregar Columna
              </button>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={() => setShowConfigModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={handleSaveConfig} className="btn-primary" style={{ flex: 1 }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {deleteConfirmId !== null && (
        <Portal>
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
            padding: "1rem"
          }}>
            <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "1.5rem", textAlign: "center" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "50%", 
                  background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  margin: "0 auto 1rem" 
                }}>
                  <Trash2 size={24} />
                </div>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem" }}>Eliminar Análisis</h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  ¿Estás seguro que deseas eliminar este análisis? Esta acción no se puede deshacer.
                </p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={executeDelete} className="btn-primary" style={{ flex: 1, background: "var(--danger)", borderColor: "var(--danger)", color: "white" }}>Eliminar</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
