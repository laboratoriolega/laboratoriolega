"use client";

import { format } from "date-fns";
import { Clock, FileText } from "lucide-react";

export default function DashboardTable({ appointments }: { appointments: any[] }) {
  if (!appointments || appointments.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <FileText size={48} style={{ opacity: 0.5 }} />
          <p>No hay turnos registrados aún. El Excel está en blanco.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Hora / Fecha</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Paciente</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Obra Social</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Análisis</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Estado</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt: any) => (
            <tr key={apt.id} className="hoverable-row" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }}>
              <td style={{ padding: '1rem', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--primary)" />
                  {(() => {
                    try {
                      if (!apt.appointment_date) return "--:--";
                      // Client component: this will be the user's local time
                      const d = new Date(apt.appointment_date);
                      if (isNaN(d.getTime())) return "--:--";
                      return format(d, "HH:mm");
                    } catch (e) {
                      return "--:--";
                    }
                  })()}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(() => {
                    try {
                      if (!apt.appointment_date) return "Sin fecha";
                      const d = new Date(apt.appointment_date);
                      if (isNaN(d.getTime())) return "Fecha inválida";
                      return format(d, "dd/MM/yyyy");
                    } catch (e) {
                      return "Error fecha";
                    }
                  })()}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <p style={{ fontWeight: 600 }}>{apt.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {apt.dni}</p>
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{ background: 'var(--glass-bg)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500, border: '1px solid var(--glass-border)' }}>
                  {apt.health_insurance}
                </span>
              </td>
              <td style={{ padding: '1rem', color: 'var(--accent)', fontWeight: 500 }}>
                {apt.analysis_type}
                {apt.aire_test_type && (
                  <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)' }}>
                    ({apt.aire_test_type})
                  </span>
                )}
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  background: apt?.status === 'AGENDADO' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                  color: apt?.status === 'AGENDADO' ? 'var(--primary)' : 'var(--success)', 
                  padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                  {apt?.status || 'AGENDADO'}
                </span>
              </td>
              <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {apt.observations || '-'}
                {apt.has_document && (
                  <div style={{ marginTop: '0.5rem' }}>
                      <a href={`/api/doc/${apt.id}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                        📎 Ver Pedido
                      </a>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
