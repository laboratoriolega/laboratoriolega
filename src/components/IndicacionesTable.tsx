"use client";

import { useState, useMemo } from "react";
import { toggleIndicationsStatus } from "@/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Loader2, MessageSquare, Phone, Search, Wind, Car } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IndicacionesTable({ data }: { data: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "sent" | "pending">("all");

  // Filter logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Status Filter
    if (filterStatus === "sent") {
      result = result.filter(a => a.indications_sent);
    } else if (filterStatus === "pending") {
      result = result.filter(a => !a.indications_sent);
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(q) || 
        a.dni?.toLowerCase().includes(q) || 
        a.phone?.toLowerCase().includes(q) ||
        a.aire_test_type?.toLowerCase().includes(q)
      );
    }

    return result.sort((a,b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
  }, [data, filterStatus, searchQuery]);

  // Original data stats
  const total = data.length;
  const sent = data.filter(a => a.indications_sent).length;
  const pending = total - sent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Stats Summary - Interactive */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div 
          className="glass-panel" 
          onClick={() => setFilterStatus("all")}
          style={{ 
            padding: "1rem 1.5rem", flex: 1, minWidth: "150px", cursor: "pointer",
            border: filterStatus === "all" ? "2px solid var(--primary)" : "1px solid var(--glass-border)",
            transition: "all 0.2s ease"
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>Total Pacientes (Aire/Dom)</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0" }}>{total}</h3>
        </div>
        <div 
          className="glass-panel" 
          onClick={() => setFilterStatus("sent")}
          style={{ 
            padding: "1rem 1.5rem", flex: 1, minWidth: "150px", cursor: "pointer",
            border: filterStatus === "sent" ? "2px solid var(--success)" : "1px solid var(--glass-border)",
            borderLeft: "4px solid var(--success)",
            transition: "all 0.2s ease",
            background: filterStatus === "sent" ? "rgba(16, 185, 129, 0.05)" : "var(--glass-bg)"
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>Indicaciones Enviadas</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "var(--success)" }}>{sent}</h3>
        </div>
        <div 
          className="glass-panel" 
          onClick={() => setFilterStatus("pending")}
          style={{ 
            padding: "1rem 1.5rem", flex: 1, minWidth: "150px", cursor: "pointer",
            border: filterStatus === "pending" ? "2px solid var(--danger)" : "1px solid var(--glass-border)",
            borderLeft: "4px solid var(--danger)",
            transition: "all 0.2s ease",
            background: filterStatus === "pending" ? "rgba(239, 68, 68, 0.05)" : "var(--glass-bg)"
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>Pendientes de Envío</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "var(--danger)" }}>{pending}</h3>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
          {filterStatus === "all" ? "Todos los turnos" : (filterStatus === "sent" ? "Enviados" : "Pendientes")} ({filteredData.length})
        </h3>
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI o teléfono..." 
            className="input-field"
            style={{ width: '100%', paddingLeft: '2.5rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
            <Search size={18} />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div className="table-responsive">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)", fontSize: "0.85rem", borderBottom: "1px solid var(--glass-border)" }}>
                <th style={{ padding: "1rem" }}>Fecha / Hora</th>
                <th style={{ padding: "1rem" }}>Paciente</th>
                <th style={{ padding: "1rem" }}>Tipo de Test</th>
                <th style={{ padding: "1rem" }}>Teléfono</th>
                <th style={{ padding: "1rem", textAlign: "center" }}>Indicaciones WS</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((apt: any) => (
                <tr key={apt.id} style={{ borderBottom: "1px solid var(--glass-border)", background: apt.indications_sent ? "rgba(16, 185, 129, 0.02)" : "transparent" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                      <span style={{ fontWeight: 600 }}>{format(new Date(apt.appointment_date), "dd/MM/yyyy")}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Clock size={12} /> {format(new Date(apt.appointment_date), "HH:mm")}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{apt.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>DNI: {apt.dni}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {apt.is_domicilio ? <Car size={14} color="#f59e0b" /> : <Wind size={14} color="#4a90e2" />}
                      <span style={{ 
                        padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                        background: apt.is_domicilio ? "rgba(245, 158, 11, 0.1)" : "rgba(74, 144, 226, 0.1)", 
                        color: apt.is_domicilio ? "#f59e0b" : "#4a90e2"
                      }}>
                        {apt.aire_test_type || apt.analysis_type || "General"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {apt.phone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Phone size={14} color="var(--text-muted)" />
                        <span>{apt.phone}</span>
                      </div>
                    ) : "-"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {loadingId === apt.id ? (
                      <Loader2 size={20} className="animate-spin" color="var(--primary)" />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        <input 
                          type="checkbox"
                          checked={apt.indications_sent || false}
                          onChange={async (e) => {
                            setLoadingId(apt.id);
                            try {
                              const res = await toggleIndicationsStatus(apt.id, e.target.checked);
                              if (res.success) {
                                router.refresh();
                              } else {
                                alert(res.error);
                              }
                            } catch (err) {
                              alert("Error al actualizar");
                            } finally {
                              setLoadingId(null);
                            }
                          }}
                          style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                        />
                        {apt.indications_sent && <CheckCircle size={16} color="var(--success)" />}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <Wind size={40} style={{ opacity: 0.2 }} />
                      <p>No se encontraron resultados para los filtros aplicados.</p>
                    </div>
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
