"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, FileText, ChevronDown, ExternalLink } from "lucide-react";

export default function DashboardTable({ appointments }: { appointments: any[] }) {
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);

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
            <th style={{ padding: '1rem', fontWeight: 500 }}>Observaciones / Pedido</th>
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
              <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', position: 'relative' }}>
                <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {apt.observations || '-'}
                </div>
                
                {apt.documents && apt.documents.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {apt.documents.length === 1 ? (
                      <a 
                        href={`/api/doc/file/${apt.documents[0].id}`} 
                        target="_blank" 
                        style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontSize: '0.8rem' }}
                      >
                        📎 Ver Pedido
                      </a>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setOpenDocsId(openDocsId === apt.id ? null : apt.id)}
                          style={{ 
                            background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', 
                            border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '6px',
                            padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer'
                          }}
                        >
                          📎 Ver Pedidos ({apt.documents.length})
                          <ChevronDown size={14} style={{ transform: openDocsId === apt.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        
                        {openDocsId === apt.id && (
                          <div style={{ 
                            position: 'absolute', top: '100%', left: 0, marginTop: '0.4rem',
                            background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
                            border: '1px solid var(--glass-border)', borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            zIndex: 50, minWidth: '200px', padding: '0.5rem',
                            display: 'flex', flexDirection: 'column', gap: '0.25rem',
                            animation: 'fadeIn 0.2s ease'
                          }}>
                            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                            <p style={{ margin: '0 0 0.4rem 0.4rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seleccionar archivo:</p>
                            {apt.documents.map((doc: any) => (
                              <a 
                                key={doc.id}
                                href={`/api/doc/file/${doc.id}`} 
                                target="_blank" 
                                onClick={() => setOpenDocsId(null)}
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem',
                                  borderRadius: '6px', color: 'var(--text-main)', textDecoration: 'none',
                                  fontSize: '0.75rem', transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <ExternalLink size={12} color="var(--primary)" />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename || 'Ver Pedido'}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
