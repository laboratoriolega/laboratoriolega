"use client";

import { useState } from "react";
import { updateBillingPrice } from "@/actions/listados";
import { Search, Save, X, DollarSign } from "lucide-react";

export default function BillingPricesTable({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const filteredItems = items.filter(item => 
    item.analisis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleSave(id: number) {
    const res = await updateBillingPrice(id, editValues);
    if (!res.error) {
      setItems(items.map(it => it.id === id ? { ...it, ...editValues } : it));
      setEditingId(null);
    } else {
      alert(res.error);
    }
  }

  const columns = [
    { key: "cibic", label: "CIBIC" },
    { key: "gornitz", label: "GORNITZ" },
    { key: "fpm", label: "FPM" },
    { key: "manlab", label: "MANLAB" },
    { key: "lerda", label: "LERDA" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Search size={20} style={{ color: "var(--text-muted)" }} />
        <input 
          className="input-field" 
          placeholder="Buscar análisis por nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: "none", background: "transparent", boxShadow: "none" }}
        />
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.8rem", borderBottom: "1px solid var(--glass-border)", background: "var(--bg-gradient-end)" }}>
                <th style={{ padding: "1rem", minWidth: "200px" }}>Análisis</th>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: "1rem", textAlign: "center" }}>{col.label}</th>
                ))}
                <th style={{ padding: "1rem", width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="hoverable-row" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600 }}>{item.analisis}</td>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "0.5rem", textAlign: "center" }}>
                      {editingId === item.id ? (
                        <input 
                          className="input-field" 
                          style={{ textAlign: "center", padding: "0.4rem", fontSize: "0.8rem" }}
                          defaultValue={item[col.key]} 
                          onChange={(e) => setEditValues({ ...editValues, [col.key]: e.target.value })}
                        />
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: item[col.key] ? "var(--text-main)" : "var(--text-muted)" }}>
                          {item[col.key] ? `${item[col.key]}` : "-"}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {editingId === item.id ? (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => handleSave(item.id)} style={{ color: "var(--success)" }}><Save size={16} /></button>
                        <button onClick={() => setEditingId(null)}><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(item.id); setEditValues(item); }} style={{ color: "var(--primary)", fontSize: "0.8rem" }}>
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
