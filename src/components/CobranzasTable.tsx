"use client";

import { useState } from "react";
import { updateCobranza, createCobranza, deleteCobranza } from "@/actions/listados";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Save, X, Search } from "lucide-react";

export default function CobranzasTable({ data }: { data: any[] }) {
    const [items, setItems] = useState(data);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<any>({});
    const [showNewRow, setShowNewRow] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Stats calculation
    const stats = items.reduce((acc: any, item: any) => {
        acc[item.seguimiento] = (acc[item.seguimiento] || 0) + 1;
        return acc;
    }, { "Pendiente": 0, "En Proceso": 0, "Finalizado": 0 });

    // Filtering and Searching
    const filteredItems = items.filter(it => {
        const matchesStatus = statusFilter ? it.seguimiento === statusFilter : true;
        const s = searchTerm.toLowerCase();
        const matchesSearch =
            it.paciente?.toLowerCase().includes(s) ||
            it.dni?.toLowerCase().includes(s) ||
            it.factura?.toLowerCase().includes(s) ||
            it.observacion?.toLowerCase().includes(s) ||
            it.fecha?.includes(s) ||
            it.seguimiento?.toLowerCase().includes(s);

        return matchesStatus && matchesSearch;
    });

    // Group by month
    const groups = filteredItems.reduce((acc: any, item: any) => {
        const month = item.month_group;
        if (!acc[month]) acc[month] = [];
        acc[month].push(item);
        return acc;
    }, {});

    const sortedMonths = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    async function handleSave(id: number) {
        const res = await updateCobranza(id, editValues);
        if (!res.error) {
            setItems(items.map(it => it.id === id ? { ...it, ...editValues } : it));
            setEditingId(null);
        } else {
            alert(res.error);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("¿Eliminar este registro de cobranza?")) return;
        const res = await deleteCobranza(id);
        if (!res.error) {
            setItems(items.filter(it => it.id !== id));
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                {/* Status Filters */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                        onClick={() => setStatusFilter(statusFilter === "Pendiente" ? null : "Pendiente")}
                        style={{
                            padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #EF4444", fontSize: "0.85rem", fontWeight: 600,
                            background: statusFilter === "Pendiente" ? "#EF4444" : "rgba(239, 68, 68, 0.1)",
                            color: statusFilter === "Pendiente" ? "white" : "#EF4444",
                            display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
                        }}
                    >
                        Pendientes <span style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }}>{stats["Pendiente"]}</span>
                    </button>
                    <button
                        onClick={() => setStatusFilter(statusFilter === "En Proceso" ? null : "En Proceso")}
                        style={{
                            padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #FBBF24", fontSize: "0.85rem", fontWeight: 600,
                            background: statusFilter === "En Proceso" ? "#FBBF24" : "rgba(251, 191, 36, 0.1)",
                            color: statusFilter === "En Proceso" ? "white" : "#FBBF24",
                            display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
                        }}
                    >
                        En Proceso <span style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }}>{stats["En Proceso"]}</span>
                    </button>
                    <button
                        onClick={() => setStatusFilter(statusFilter === "Finalizado" ? null : "Finalizado")}
                        style={{
                            padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #10B981", fontSize: "0.85rem", fontWeight: 600,
                            background: statusFilter === "Finalizado" ? "#10B981" : "rgba(16, 185, 129, 0.1)",
                            color: statusFilter === "Finalizado" ? "white" : "#10B981",
                            display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
                        }}
                    >
                        Finalizados <span style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(0,0,0,0.1)" }}>{stats["Finalizado"]}</span>
                    </button>
                </div>

                {/* Search and Add */}
                <div style={{ display: "flex", gap: "1rem", flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
                    <div style={{ position: "relative", maxWidth: "300px", width: "100%" }}>
                        <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="input-field"
                            style={{ paddingLeft: "2.5rem" }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setShowNewRow(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
                        <Plus size={18} /> Nueva Cobranza
                    </button>
                </div>
            </div>

            {/* New Record Form */}
            {showNewRow && (
                <form action={async (fd) => {
                    const res = await createCobranza(fd);
                    if (!res.error) {
                        window.location.reload();
                    }
                }} className="glass-panel" style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", alignItems: "end" }}>
                    <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Fecha</label>
                        <input name="fecha" type="date" required className="input-field" defaultValue={format(new Date(), "yyyy-MM-dd")} />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Paciente</label>
                        <input name="paciente" required className="input-field" placeholder="Nombre completo" />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>DNI</label>
                        <input name="dni" type="number" className="input-field" placeholder="Solo números" />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Factura #</label>
                        <input name="factura" className="input-field" placeholder="Ej: 001-2345" />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Seguimiento</label>
                        <select name="seguimiento" className="input-field">
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Observación</label>
                        <input name="observacion" className="input-field" placeholder="Detalles adicionales..." />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="submit" className="btn-primary">Guardar</button>
                        <button type="button" onClick={() => setShowNewRow(false)} style={{ color: "var(--danger)" }}><X /></button>
                    </div>
                </form>
            )}

            {/* Data Tables by Month */}
            {sortedMonths.length > 0 ? sortedMonths.map(month => (
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
                                    <th style={{ padding: "1rem" }}>Paciente / DNI</th>
                                    <th style={{ padding: "1rem" }}>Factura</th>
                                    <th style={{ padding: "1rem" }}>Seguimiento</th>
                                    <th style={{ padding: "1rem" }}>Observación</th>
                                    <th style={{ padding: "1rem", textAlign: "right" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups[month].map((item: any) => (
                                    <tr key={item.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                        <td style={{ padding: "1rem" }}>{format(new Date(item.fecha), "dd/MM/yyyy")}</td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ fontWeight: 600 }}>{item.paciente}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.dni || "-"}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            {editingId === item.id ? (
                                                <input
                                                    className="input-field"
                                                    defaultValue={item.factura}
                                                    onChange={(e) => setEditValues({ ...editValues, factura: e.target.value })}
                                                />
                                            ) : (item.factura || "-")}
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
                                                    border: `1px solid ${item.seguimiento === 'Finalizado' ? '#10B981' : (item.seguimiento === 'En Proceso' ? '#FBBF24' : '#EF4444')}`,
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
                                                    defaultValue={item.observacion}
                                                    onChange={(e) => setEditValues({ ...editValues, observacion: e.target.value })}
                                                />
                                            ) : (item.observacion || "-")}
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                                {editingId === item.id ? (
                                                    <>
                                                        <button onClick={() => handleSave(item.id)} style={{ color: "var(--success)", border: "none", background: "none", cursor: "pointer" }}><Save size={18} /></button>
                                                        <button onClick={() => setEditingId(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setEditingId(item.id); setEditValues(item); }} style={{ color: "var(--primary)", border: "none", background: "rgba(14, 165, 233, 0.1)", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.85rem", cursor: "pointer" }}>Editar</button>
                                                        <button onClick={() => handleDelete(item.id)} style={{ color: "var(--danger)", border: "none", background: "none", cursor: "pointer" }}><Trash2 size={18} /></button>
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
            )) : (
                <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No se encontraron registros de cobranza.
                </div>
            )}
        </div>
    );
}
