"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FileText, ChevronDown, ChevronUp, Clock, Info } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  CREATE_APPOINTMENT:         "creó el turno",
  UPDATE_APPOINTMENT:         "modificó el turno",
  UPDATE_EVOLUTION:           "actualizó evolución / notas",
  MOVE_APPOINTMENT:           "reprogramó el turno",
  DELETE_DOCUMENT:            "eliminó un documento",
  DELETE_APPOINTMENT:         "eliminó el turno",
  UPDATE_APPOINTMENT_STATUS:  "cambió el estado del turno",
  ADD_DOCUMENT:               "adjuntó un documento",
};

export default function HistoryItem({ apt }: { apt: any }) {
  const [isOpen, setIsOpen] = useState(false);
  
  try {
    const isPast = apt.appointment_date ? new Date(apt.appointment_date) < new Date() : false;

    return (
      <div style={{ 
        border: '1px solid var(--glass-border)', 
        borderRadius: '12px', 
        background: 'var(--glass-bg)', 
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
      }}>
        {/* Header clickable */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            padding: '1.25rem', 
            cursor: 'pointer',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem',
            background: isOpen ? 'rgba(14, 165, 233, 0.03)' : 'transparent'
          }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <span style={{ 
                background: apt.status === 'COMPLETADO' || isPast ? 'rgba(148, 163, 184, 0.2)' : 'var(--primary)', 
                color: apt.status === 'COMPLETADO' || isPast ? 'var(--text-muted)' : 'white', 
                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 
              }}>
                {isPast && apt.status === 'AGENDADO' ? 'PASADO' : (apt.status || "AGENDADO")}
              </span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {apt.analysis_type || "Consulta"}
                {apt.aire_test_type && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>
                    ({apt.aire_test_type})
                  </span>
                )}
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} />
              {(() => {
                try {
                  if (!apt.appointment_date) return "Sin fecha";
                  const d = new Date(apt.appointment_date);
                  if (isNaN(d.getTime())) return "Fecha inválida";
                  return format(d, "PPP p", { locale: es });
                } catch (e) {
                  return "Error en fecha";
                }
              })()}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {apt.documents && apt.documents.length > 0 && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                {apt.documents.length} adjuntos
              </span>
            )}
            {isOpen ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
          </div>
        </div>

        {isOpen && (
          <div style={{ 
            padding: '1.25rem', 
            borderTop: '1px solid var(--glass-border)', 
            background: 'rgba(14, 165, 233, 0.02)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Notas de Evolución */}
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} color="var(--primary)" /> Evolución y Notas:
                </h5>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--glass-bg)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}>
                  {apt.evolution_notes || "Sin notas de evolución registradas."}
                </div>
              </div>

              {/* Observaciones Originales */}
              {apt.observations && (
                <div>
                  <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={14} color="var(--text-muted)" /> Observaciones Iniciales:
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    "{apt.observations}"
                  </p>
                </div>
              )}

              {/* Documentos */}
              {apt.documents && apt.documents.length > 0 && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={14} color="var(--primary)" /> Documentos y Pedidos:
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {apt.documents.map((doc: any) => (
                      <a key={doc.id} href={doc.url} target="_blank" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--primary)',
                        fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none', transition: 'all 0.2s',
                      }}>
                         📎 {doc.filename || "Ver Archivo"}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de Cambios (Audit Trail) */}
              {apt.audit_trail && apt.audit_trail.length > 0 && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={14} color="var(--primary)" /> Historial de Gestiones:
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {apt.audit_trail.map((log: any) => {
                      let details: any = {};
                      try {
                        details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
                      } catch (e) {
                        details = {};
                      }
                      const actionLabel = ACTION_LABELS[log.action] || log.action?.replace(/_/g, ' ') || "Acción";
                      const STATUS_ES: Record<string, string> = {
                        AGENDADO: "Agendado", COMPLETADO: "Completado",
                        CANCELADO: "Cancelado", REAGENDADO: "Reagendado",
                      };
                      const statusTextEs = details?.new_status ? ` → ${STATUS_ES[details.new_status] || details.new_status}` : '';
                      
                      const safeFormatAudit = (dateStr: string) => {
                        try {
                          if (!dateStr) return "---";
                          const d = new Date(dateStr);
                          if (isNaN(d.getTime())) return "---";
                          return format(d, "dd/MM HH:mm");
                        } catch (e) {
                          return "---";
                        }
                      };

                      return (
                        <div key={log.id} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(14, 165, 233, 0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{(log.username || "Sistema")}</span> {actionLabel}
                            {statusTextEs && <span style={{ marginLeft: '5px', color: 'var(--primary)', fontWeight: 600 }}>{statusTextEs}</span>}
                          </div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            {safeFormatAudit(log.created_at)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div style={{ padding: '1rem', border: '1px solid var(--danger)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', fontSize: '0.85rem' }}>
        ⚠️ Error al cargar este turno (ID: {apt?.id || '?'})
      </div>
    );
  }
}
