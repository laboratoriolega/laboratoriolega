"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Clock, FileText, ChevronDown, ExternalLink, Check, Trash2, CalendarPlus, X, Loader2 } from "lucide-react";
import { updateAppointmentStatus } from "@/actions/appointments";
import AppointmentModal from "./AppointmentModal";
import MoveReasonModal from "./MoveReasonModal";

import Portal from "./Portal";

export default function DashboardTable({ appointments }: { appointments: any[] }) {
  const router = useRouter();
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Rescheduling state
  const [rescheduleData, setRescheduleData] = useState<any | null>(null);
  
  // Cancellation state
  const [cancelData, setCancelData] = useState<{ id: string, name: string } | null>(null);

  if (!appointments || appointments.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <FileText size={48} style={{ opacity: 0.5 }} />
          <p>No hay turnos registrados aún.</p>
        </div>
      </div>
    );
  }

  function handleOpenStatus(id: string, e: React.MouseEvent) {
    if (openStatusId === id) {
      setOpenStatusId(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setStatusMenuPos({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX 
      });
      setOpenStatusId(id);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setLoadingId(id);
    setOpenStatusId(null);
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert("Error al actualizar estado");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCancel(id: string, reason: string) {
    setLoadingId(id);
    setCancelData(null);
    try {
      const res = await updateAppointmentStatus(id, 'CANCELADO', reason);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert("Error al cancelar turno");
    } finally {
      setLoadingId(null);
    }
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
              <td style={{ padding: '1rem', position: 'relative' }}>
                <button 
                  onClick={(e) => handleOpenStatus(apt.id, e)}
                  disabled={loadingId === apt.id}
                  style={{ 
                    background: apt?.status === 'AGENDADO' ? 'rgba(14, 165, 233, 0.2)' : (apt?.status === 'CANCELADO' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(16, 185, 129, 0.2)'), 
                    color: apt?.status === 'AGENDADO' ? 'var(--primary)' : (apt?.status === 'CANCELADO' ? '#64748b' : 'var(--success)'), 
                    padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {loadingId === apt.id ? <Loader2 size={14} className="animate-spin" /> : <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>}
                  {apt?.status || 'AGENDADO'}
                  <ChevronDown size={14} style={{ transform: openStatusId === apt.id ? 'rotate(180deg)' : 'none', opacity: 0.6 }} />
                </button>

                {openStatusId === apt.id && (
                  <Portal>
                    {/* Overlay to catch clicks outside */}
                    <div 
                      onClick={() => setOpenStatusId(null)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: statusMenuPos.top, 
                      left: statusMenuPos.left,
                      marginTop: '0.5rem',
                      background: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 1000, minWidth: '180px', padding: '0.5rem',
                      display: 'flex', flexDirection: 'column', gap: '0.25rem', animation: 'fadeIn 0.15s ease'
                    }}>
                      <button onClick={() => handleStatusChange(apt.id, 'COMPLETADO')} className="status-option" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', borderRadius: '8px', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                        <Check size={16} color="var(--success)" /> Confirmar Asistencia
                      </button>
                      <button onClick={() => setCancelData({ id: apt.id, name: apt.name })} className="status-option" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', borderRadius: '8px', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--danger)' }}>
                        <Trash2 size={16} /> Cancelar Turno
                      </button>
                      <button onClick={() => { setRescheduleData(apt); setOpenStatusId(null); }} className="status-option" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', borderRadius: '8px', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>
                        <CalendarPlus size={16} /> Reagendar
                      </button>
                      <style>{`.status-option:hover { background: rgba(0,0,0,0.05); } @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    </div>
                  </Portal>
                )}
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

      {cancelData && (
        <MoveReasonModal 
          isOpen={!!cancelData}
          apptId={cancelData.id}
          patientName={cancelData.name}
          onConfirm={(reason: string) => handleCancel(cancelData.id, reason)}
          onClose={() => setCancelData(null)}
          title="Cancelar Turno"
          confirmLabel="Confirmar Cancelación"
          placeholder="Motivo de la cancelación..."
        />
      )}

      {/* Rescheduling Modal */}
      {rescheduleData && (
        <AppointmentModal 
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          initialData={{
            name: rescheduleData.name,
            dni: rescheduleData.dni,
            phone: rescheduleData.phone,
            health_insurance: rescheduleData.health_insurance,
            analysis_type: rescheduleData.analysis_type,
            aire_test_type: rescheduleData.aire_test_type
          }}
        />
      )}
    </div>
  );
}
