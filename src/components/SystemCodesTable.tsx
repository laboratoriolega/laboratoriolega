"use client";

import { useState } from "react";
import { updateSystemCode, createSystemCode, deleteSystemCode } from "@/actions/listados";
import { Search, Save, X, Plus, Trash2 } from "lucide-react";

export default function SystemCodesTable({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showNewRow, setShowNewRow] = useState(false);

  const filteredItems = items.filter(item => 
    item.analisis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.codigo_sistema && item.codigo_sistema.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.codigo_nbu && item.codigo_nbu.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.ub && item.ub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function handleSave(id: number) {
    const res = await updateSystemCode(id, editValues);
    if (!res.error) {
      setItems(items.map(it => it.id === id ? { ...it, ...editValues } : it));
      setEditingId(null);
    } else {
      alert(res.error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este código?")) return;
    const res = await deleteSystemCode(id);
    if (!res.error) {
      setItems(items.filter(it => it.id !== id));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div className="glass-panel" style={{ flex: 1, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Search size={20} style={{ color: "var(--text-muted)" }} />
          <input 
            className="input-field" 
            placeholder="Buscar por Análisis, Código de Sistema o NBU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", boxShadow: "none", padding: 0 }}
          />
        </div>
        <button onClick={() => setShowNewRow(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
          <Plus size={18} /> Nuevo Item
        </button>
      </div>

      {showNewRow && (
        <form action={async (fd) => {
          const res = await createSystemCode(fd);
          if (!res.error) {
            window.location.reload();
          }
        }} className="glass-panel" style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "end" }}>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Nombre del Análisis</label>
             <input name="analisis" required className="input-field" placeholder="Ej: Ferritina" />
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Código de Sistema</label>
             <input name="codigo_sistema" className="input-field" placeholder="Ej: 1234" />
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Código NBU / Obs</label>
             <input name="codigo_nbu" className="input-field" placeholder="..." />
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Unidad Bioq. (UB)</label>
             <input name="ub" className="input-field" placeholder="-" defaultValue="-" />
           </div>
           <div style={{ display: "flex", gap: "0.5rem" }}>
             <button type="submit" className="btn-primary">Guardar</button>
             <button type="button" onClick={() => setShowNewRow(false)} style={{ color: "var(--danger)" }}><X /></button>
           </div>
        </form>
      )}

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem", borderBottom: "1px solid var(--glass-border)", background: "var(--bg-gradient-end)" }}>
                <th style={{ padding: "1rem" }}>Análisis</th>
                <th style={{ padding: "1rem" }}>Código de Sistema</th>
                <th style={{ padding: "1rem" }}>Código NBU / Observación</th>
                <th style={{ padding: "1rem" }}>UB</th>
                <th style={{ padding: "1rem", width: "120px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="hoverable-row" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 500 }}>{item.analisis}</td>
                  <td style={{ padding: "1rem" }}>
                    {editingId === item.id ? (
                      <input 
                        className="input-field" 
                        defaultValue={item.codigo_sistema} 
                        onChange={(e) => setEditValues({ ...editValues, codigo_sistema: e.target.value })}
                      />
                    ) : (
                      <span style={{ fontFamily: "monospace", color: "var(--primary)", fontWeight: 600 }}>
                        {item.codigo_sistema || "-"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {editingId === item.id ? (
                      <input 
                        className="input-field" 
                        defaultValue={item.codigo_nbu} 
                        onChange={(e) => setEditValues({ ...editValues, codigo_nbu: e.target.value })}
                      />
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                         {item.codigo_nbu || "-"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {editingId === item.id ? (
                      <input 
                        className="input-field" 
                        defaultValue={item.ub} 
                        onChange={(e) => setEditValues({ ...editValues, ub: e.target.value })}
                      />
                    ) : (
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                         {item.ub || "-"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      {editingId === item.id ? (
                        <>
                          <button onClick={() => handleSave(item.id)} style={{ color: "var(--success)" }}><Save size={18} /></button>
                          <button onClick={() => setEditingId(null)}><X size={18} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(item.id); setEditValues(item); }} style={{ color: "var(--primary)", fontSize: "0.85rem" }}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(item.id)} style={{ color: "var(--danger)" }}><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No se encontraron resultados
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
