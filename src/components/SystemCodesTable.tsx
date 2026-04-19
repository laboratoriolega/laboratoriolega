"use client";

import { useState } from "react";
import { updateSystemCode } from "@/actions/listados";
import { Search, Save, X } from "lucide-react";

export default function SystemCodesTable({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const filteredItems = items.filter(item => 
    item.analisis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.codigo_sistema && item.codigo_sistema.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.codigo_nbu && item.codigo_nbu.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Search size={20} style={{ color: "var(--text-muted)" }} />
        <input 
          className="input-field" 
          placeholder="Buscar por Análisis, Código de Sistema o NBU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: "none", background: "transparent", boxShadow: "none" }}
        />
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem", borderBottom: "1px solid var(--glass-border)", background: "var(--bg-gradient-end)" }}>
                <th style={{ padding: "1rem" }}>Análisis</th>
                <th style={{ padding: "1rem" }}>Código de Sistema</th>
                <th style={{ padding: "1rem" }}>Código NBU / Observación</th>
                <th style={{ padding: "1rem", width: "100px" }}></th>
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
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {editingId === item.id ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleSave(item.id)} style={{ color: "var(--success)" }}><Save size={18} /></button>
                        <button onClick={() => setEditingId(null)}><X size={18} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(item.id); setEditValues(item); }} style={{ color: "var(--primary)", fontSize: "0.85rem" }}>
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
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
