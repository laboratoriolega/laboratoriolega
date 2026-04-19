import pool from '@/lib/db';
import { Calendar, Stethoscope, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = "force-dynamic";

export default async function PacienteHistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Obtener data del paciente
  const patientRes = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
  const patient = patientRes.rows[0];

  if (!patient) {
    return <div style={{ padding: '2rem' }}>Paciente no encontrado.</div>;
  }

  // Obtener historial clinico (Turnos pasados y futuros)
  const apptsRes = await pool.query(`
    SELECT id, appointment_date, status, analysis_type, observations,
           CASE WHEN (document_url IS NOT NULL OR document_base64 IS NOT NULL) THEN true ELSE false END as has_document
    FROM appointments 
    WHERE patient_id = $1 
    ORDER BY appointment_date DESC
  `, [id]);
  const appointments = apptsRes.rows.map(row => ({
    ...row,
    appointment_date: row.appointment_date ? new Date(row.appointment_date).toISOString() : null
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/pacientes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Volver al Directorio
          </Link>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              {(patient.name || '?').charAt(0).toUpperCase()}
            </div>
            {patient.name || 'Paciente Sin Nombre'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            DNI: {patient.dni} • Teléfono: {patient.phone || 'No registrado'} • Obra Social: {patient.health_insurance}
          </p>
        </div>
      </header>

      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={20} color="var(--primary)" />
            Historial Clínico
          </h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 600 }}>
            {appointments.length} Consultas Registradas
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {appointments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No existen visitas previas para este paciente.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appointments.map((apt) => {
                const isPast = new Date(apt.appointment_date) < new Date();
                return (
                  <div key={apt.id} style={{ 
                    border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '12px', 
                    background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ 
                          background: isPast ? '#e2e8f0' : 'var(--primary)', 
                          color: isPast ? '#64748b' : 'white', 
                          padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 
                        }}>
                          {isPast ? 'Completado' : apt.status}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {apt.analysis_type}
                          {apt.aire_test_type && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>
                              ({apt.aire_test_type})
                            </span>
                          )}
                        </h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        {(() => {
                          try {
                            if (!apt.appointment_date) return "Sin fecha definida";
                            const d = new Date(apt.appointment_date);
                            if (isNaN(d.getTime())) return "Fecha inválida";
                            return format(d, "PPPPp", { locale: es });
                          } catch (e) {
                            return "Error fecha";
                          }
                        })()}
                      </p>
                      {apt.observations && (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                          " {apt.observations} "
                        </p>
                      )}
                    </div>
                    
                    {apt.has_document && (
                      <a href={`/api/doc/${apt.id}`} target="_blank" className="hoverable-link" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
                        background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: 'var(--primary)',
                        fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                         📎 Pedido Médico
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
