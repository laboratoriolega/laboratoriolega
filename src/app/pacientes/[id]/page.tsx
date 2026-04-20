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

  // Obtener historial clinico (Turnos pasados y futuros) con su rastro de auditoría
  const apptsRes = await pool.query(`
    SELECT a.id, a.appointment_date, a.status, a.analysis_type, a.aire_test_type, a.observations, a.evolution_notes,
           (SELECT json_agg(json_build_object('id', ad.id, 'url', ad.document_url, 'filename', ad.filename)) 
            FROM appointment_documents ad WHERE ad.appointment_id = a.id) as documents,
           (SELECT json_agg(json_build_object('id', al.id, 'action', al.action, 'details', al.details, 'created_at', al.created_at, 'username', u.username))
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            WHERE al.action IN ('CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'UPDATE_EVOLUTION', 'MOVE_APPOINTMENT', 'DELETE_DOCUMENT')
              AND (al.details::text LIKE '%' || a.id || '%')
            ORDER BY al.created_at ASC) as audit_trail
    FROM appointments a
    WHERE a.patient_id = $1 
    ORDER BY a.appointment_date DESC
  `, [id]);
  
  const appointments = (apptsRes.rows || []).filter(row => row && row.id);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <Link href="/pacientes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Volver al Directorio
          </Link>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
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
            Historial de Consultas
          </h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 600 }}>
            {appointments.length} Visitas
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {appointments.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No existen visitas previas para este paciente.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appointments.map((apt) => (
                <HistoryItem key={apt.id} apt={apt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import HistoryItem from '@/components/HistoryItem';
