"use client";

import { useState } from "react";
import { Search, Save, X, Plus, Trash2, Check } from "lucide-react";
import { createAnalisisLista, updateAnalisisLista, deleteAnalisisLista } from "@/actions/listados";

export default function AnalisisExcelTable({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowValues, setNewRowValues] = useState<any>({});

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      (item.analisis && item.analisis.toLowerCase().includes(term)) ||
      (item.derivacion && item.derivacion.toLowerCase().includes(term)) ||
      (item.muestra && item.muestra.toLowerCase().includes(term)) ||
      (item.guia && item.guia.toLowerCase().includes(term)) ||
      (item.indicaciones && item.indicaciones.toLowerCase().includes(term)) ||
      (item.demora && item.demora.toLowerCase().includes(term)) ||
      (item.observaciones && item.observaciones.toLowerCase().includes(term))
    );
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

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este análisis?")) return;
    const res = await deleteAnalisisLista(id);
    if (!res.error) {
      setItems(items.filter((it: any) => it.id !== id));
    }
  }

  const renderCell = (item: any, field: string, placeholder: string = "-") => {
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

  const renderNewCell = (field: string, placeholder: string) => (
    <input 
      className="input-field" 
      placeholder={placeholder}
      onChange={(e) => setNewRowValues({ ...newRowValues, [field]: e.target.value })}
      style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--primary)", borderRadius: "4px" }}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div className="glass-panel" style={{ flex: 1, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Search size={20} style={{ color: "var(--text-muted)" }} />
          <input 
            className="input-field" 
            placeholder="Buscar en todas las celdas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", boxShadow: "none", padding: 0 }}
          />
        </div>
        <button onClick={() => setShowNewRow(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
          <Plus size={18} /> Nueva Fila
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div className="table-responsive" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem", background: "var(--bg-gradient-end)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "15%" }}>Análisis</th>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "10%" }}>Derivación</th>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "15%" }}>Muestra</th>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "10%" }}>Guía</th>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "20%" }}>Indicaciones</th>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "10%" }}>Demora</th>
                <th style={{ padding: "1rem", borderRight: "1px solid var(--glass-border)", width: "15%" }}>Observaciones</th>
                <th style={{ padding: "1rem", width: "5%", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {showNewRow && (
                <tr style={{ borderBottom: "1px solid var(--glass-border)", background: "rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("analisis", "Análisis")}</td>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("derivacion", "Derivación")}</td>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("muestra", "Muestra")}</td>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("guia", "Guía")}</td>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("indicaciones", "Indicaciones")}</td>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("demora", "Demora")}</td>
                  <td style={{ padding: "0.5rem", borderRight: "1px solid var(--glass-border)" }}>{renderNewCell("observaciones", "Observaciones")}</td>
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
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.9rem", fontWeight: 500, verticalAlign: "top" }}>
                    {renderCell(item, "analisis", "Análisis...")}
                  </td>
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                    {renderCell(item, "derivacion", "Derivación...")}
                  </td>
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                    {renderCell(item, "muestra", "Muestra...")}
                  </td>
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                    {renderCell(item, "guia", "Guía...")}
                  </td>
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                    {renderCell(item, "indicaciones", "Indicaciones...")}
                  </td>
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                    {renderCell(item, "demora", "Demora...")}
                  </td>
                  <td style={{ padding: "0.75rem", borderRight: "1px solid var(--glass-border)", fontSize: "0.85rem", verticalAlign: "top" }}>
                    {renderCell(item, "observaciones", "Observaciones...")}
                  </td>
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
                </tr>
              ))}
              {filteredItems.length === 0 && !showNewRow && (
                <tr>
                  <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No se encontraron análisis
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
