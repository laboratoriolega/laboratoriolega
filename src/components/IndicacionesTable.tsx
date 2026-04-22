"use client";

import { useState } from "react";
import { toggleIndicationsStatus } from "@/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Loader2, MessageSquare, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IndicacionesTable({ data }: { data: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Stats calculation
  const total = data.length;
  const sent = data.filter(a => a.indications_sent).length;
  const pending = total - sent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Stats Summary */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div className="glass-panel" style={{ padding: "1rem 1.5rem", flex: 1, minWidth: "150px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>Total Pacientes Aire</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0" }}>{total}</h3>
        </div>
        <div className="glass-panel" style={{ padding: "1rem 1.5rem", flex: 1, minWidth: "150px", borderLeft: "4px solid var(--success)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>Indicaciones Enviadas</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "var(--success)" }}>{sent}</h3>
        </div>
        <div className="glass-panel" style={{ padding: "1rem 1.5rem", flex: 1, minWidth: "150px", borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>Pendientes de Envío</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "var(--danger)" }}>{pending}</h3>
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
              {data.sort((a,b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()).map((apt: any) => (
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
                    <span style={{ 
                      padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                      background: "rgba(74, 144, 226, 0.1)", color: "#4a90e2"
                    }}>
                      {apt.aire_test_type || "Test de aire"}
                    </span>
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
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No hay turnos de aire programados.
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
