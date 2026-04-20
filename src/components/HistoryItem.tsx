"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FileText, ChevronDown, ChevronUp, Clock, Info } from "lucide-react";

export default function HistoryItem({ apt }: { apt: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const isPast = new Date(apt.appointment_date) < new Date();

  return (
    <div style={{ 
      border: '1px solid var(--glass-border)', 
      borderRadius: '12px', 
      background: 'var(--glass-bg)', 
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
    }}>
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
          background: isOpen ? 'rgba(0,0,0,0.02)' : 'transparent'
        }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
            <span style={{ 
              background: apt.status === 'COMPLETADO' || isPast ? '#e2e8f0' : 'var(--primary)', 
              color: apt.status === 'COMPLETADO' || isPast ? '#64748b' : 'white', 
              padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 
            }}>
              {isPast && apt.status === 'AGENDADO' ? 'PASADO' : apt.status}
            </span>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {apt.analysis_type}
              {apt.aire_test_type && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>
                  ({apt.aire_test_type})
                </span>
              )}
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} />
            {apt.appointment_date ? format(new Date(apt.appointment_date), "PPP p", { locale: es }) : "Sin fecha"}
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
          background: 'rgba(255,255,255,0.4)',
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
                background: 'white', 
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
                      background: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--primary)',
                      fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none', transition: 'all 0.2s',
                    }}>
                       📎 {doc.filename || "Ver Archivo"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
