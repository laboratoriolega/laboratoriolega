"use client";

import { useState } from "react";
import { updatePendiente, createPendiente, deletePendiente } from "@/actions/listados";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Save, X } from "lucide-react";

export default function PendientesTable({ data }: { data: any[] }) {
  const [items, setItems] = useState(data);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // Stats calculation
  const stats = items.reduce((acc: any, item: any) => {
    acc[item.seguimiento] = (acc[item.seguimiento] || 0) + 1;
    return acc;
  }, { "Pendiente": 0, "En Proceso": 0, "Finalizado": 0 });

  const filteredItems = filter ? items.filter(it => it.seguimiento === filter) : items;

  // Group by month
  const groups = filteredItems.reduce((acc: any, item: any) => {
    const month = item.month_group;
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  async function handleSave(id: number) {
    const res = await updatePendiente(id, editValues);
    if (!res.error) {
      setItems(items.map(it => it.id === id ? { ...it, ...editValues } : it));
      setEditingId(null);
    } else {
      alert(res.error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este registro?")) return;
    const res = await deletePendiente(id);
    if (!res.error) {
      setItems(items.filter(it => it.id !== id));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
           <button 
             onClick={() => setFilter(filter === "Pendiente" ? null : "Pendiente")}
             style={{ 
               padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #EF4444", fontSize: "0.85rem", fontWeight: 600,
               background: filter === "Pendiente" ? "#EF4444" : "rgba(239, 68, 68, 0.1)",
               color: filter === "Pendiente" ? "white" : "#EF4444",
               display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
             }}
           >
             Pendientes <span style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }}>{stats["Pendiente"]}</span>
           </button>
           <button 
             onClick={() => setFilter(filter === "En Proceso" ? null : "En Proceso")}
             style={{ 
               padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #FBBF24", fontSize: "0.85rem", fontWeight: 600,
               background: filter === "En Proceso" ? "#FBBF24" : "rgba(251, 191, 36, 0.1)",
               color: filter === "En Proceso" ? "white" : "#FBBF24",
               display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
             }}
           >
             En Proceso <span style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }}>{stats["En Proceso"]}</span>
           </button>
           <button 
             onClick={() => setFilter(filter === "Finalizado" ? null : "Finalizado")}
             style={{ 
               padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #10B981", fontSize: "0.85rem", fontWeight: 600,
               background: filter === "Finalizado" ? "#10B981" : "rgba(16, 185, 129, 0.1)",
               color: filter === "Finalizado" ? "white" : "#10B981",
               display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
             }}
           >
             Finalizados <span style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }}>{stats["Finalizado"]}</span>
           </button>
        </div>
        <button onClick={() => setShowNewRow(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} /> Nuevo Pendiente
        </button>
      </div>

      {showNewRow && (
        <form action={async (fd) => {
          const res = await createPendiente(fd);
          if (!res.error) {
            window.location.reload(); // Simple reload to get new ID and sort
          }
        }} className="glass-panel" style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", alignItems: "end" }}>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Fecha</label>
             <input name="fecha" type="date" required className="input-field" defaultValue={format(new Date(), "yyyy-MM-dd")} />
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Paciente</label>
             <input name="paciente" required className="input-field" placeholder="Nombre" />
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Pendiente</label>
             <select name="pendiente" className="input-field">
               <option value="Autorizacion">Autorizacion</option>
               <option value="Pedido Medico">Pedido Medico</option>
               <option value="Pago">Pago</option>
             </select>
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Detalle</label>
             <input name="detalle" className="input-field" />
           </div>
           <div>
             <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Seguimiento</label>
             <select name="seguimiento" className="input-field">
               <option value="Pendiente">Pendiente</option>
               <option value="En Proceso">En Proceso</option>
               <option value="Finalizado">Finalizado</option>
             </select>
           </div>
           <div style={{ display: "flex", gap: "0.5rem" }}>
             <button type="submit" className="btn-primary">Guardar</button>
             <button type="button" onClick={() => setShowNewRow(false)} style={{ color: "var(--danger)" }}><X /></button>
           </div>
        </form>
      )}

      {sortedMonths.map(month => (
        <div key={month} className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", background: "var(--bg-gradient-end)", borderBottom: "1px solid var(--glass-border)" }}>
            <h4 style={{ margin: 0, textTransform: "capitalize" }}>
              {format(new Date(month + "-02"), "MMMM yyyy", { locale: es })}
            </h4>
          </div>
          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem", borderBottom: "1px solid var(--glass-border)" }}>
                  <th style={{ padding: "1rem" }}>Fecha</th>
                  <th style={{ padding: "1rem" }}>Paciente</th>
                  <th style={{ padding: "1rem" }}>Pendiente</th>
                  <th style={{ padding: "1rem" }}>Detalle</th>
                  <th style={{ padding: "1rem" }}>Seguimiento</th>
                  <th style={{ padding: "1rem" }}>Observaciones</th>
                  <th style={{ padding: "1rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {groups[month].map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "1rem" }}>{format(new Date(item.fecha), "dd/MM/yyyy")}</td>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>{item.paciente}</td>
                    <td style={{ padding: "1rem" }}>
                      {editingId === item.id ? (
                        <select 
                          className="input-field" 
                          defaultValue={item.pendiente} 
                          onChange={(e) => setEditValues({ ...editValues, pendiente: e.target.value })}
                        >
                          <option value="Autorizacion">Autorizacion</option>
                          <option value="Pedido Medico">Pedido Medico</option>
                          <option value="Pago">Pago</option>
                        </select>
                      ) : (
                        <span style={{ 
                          padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600,
                          background: item.pendiente === 'Pago' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: item.pendiente === 'Pago' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {item.pendiente}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {editingId === item.id ? (
                        <input 
                          className="input-field" 
                          defaultValue={item.detalle} 
                          onChange={(e) => setEditValues({ ...editValues, detalle: e.target.value })}
                        />
                      ) : item.detalle}
                    </td>
                    <td style={{ padding: "1rem" }}>
                       {editingId === item.id ? (
                        <select 
                          className="input-field" 
                          defaultValue={item.seguimiento} 
                          onChange={(e) => setEditValues({ ...editValues, seguimiento: e.target.value })}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Finalizado">Finalizado</option>
                        </select>
                      ) : (
                        <span style={{ 
                          padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600,
                          background: item.seguimiento === 'Finalizado' ? 'rgba(16, 185, 129, 0.1)' : (item.seguimiento === 'En Proceso' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                          color: item.seguimiento === 'Finalizado' ? '#10B981' : (item.seguimiento === 'En Proceso' ? '#FBBF24' : '#EF4444'),
                          border: item.seguimiento === 'Finalizado' ? '1px solid #10B981' : (item.seguimiento === 'En Proceso' ? '1px solid #FBBF24' : '1px solid #EF4444'),
                          display: "inline-block"
                        }}>
                          {item.seguimiento}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                       {editingId === item.id ? (
                        <input 
                          className="input-field" 
                          defaultValue={item.observaciones} 
                          onChange={(e) => setEditValues({ ...editValues, observaciones: e.target.value })}
                        />
                      ) : (item.observaciones || "-")}
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
                             <button onClick={() => { setEditingId(item.id); setEditValues(item); }} style={{ color: "var(--primary)" }}>Editar</button>
                             <button onClick={() => handleDelete(item.id)} style={{ color: "var(--danger)" }}><Trash2 size={18} /></button>
                           </>
                         )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
