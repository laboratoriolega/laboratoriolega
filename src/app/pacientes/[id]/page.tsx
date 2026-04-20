import pool from '@/lib/db';
import { Calendar, Stethoscope, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import HistoryItem from '@/components/HistoryItem';

export const dynamic = "force-dynamic";

export default async function PacienteHistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Obtener data del paciente (incluyendo casting a text para evitar BigInt)
  const patientRes = await pool.query("SELECT id::text, name, dni::text, phone, health_insurance FROM patients WHERE id = $1", [id]);
  const patient = patientRes.rows[0];

  if (!patient) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>Paciente no encontrado</h2>
        <p>No se pudo encontrar un paciente con el ID: {id}</p>
      </div>
    );
  }

  // Obtener historial clinico (Turnos pasados y futuros) con su rastro de auditoría
  // Forzamos casting a text de IDs y detalles (JSONB) para evitar errores de serialización de BigInt en server components
  const apptsRes = await pool.query(`
    SELECT a.id::text, a.appointment_date, a.status, a.analysis_type, a.aire_test_type, a.observations, a.evolution_notes,
           (SELECT json_agg(json_build_object('id', ad.id::text, 'url', ad.document_url, 'filename', ad.filename)) 
            FROM appointment_documents ad WHERE ad.appointment_id = a.id) as documents,
           (SELECT json_agg(row_to_json(audit_ordered))
            FROM (
              SELECT al.id::text, al.action, al.details::text as details, al.created_at, u.username
              FROM audit_logs al
              JOIN users u ON al.user_id = u.id
              WHERE al.action IN ('CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT', 'UPDATE_EVOLUTION', 'MOVE_APPOINTMENT', 'DELETE_DOCUMENT', 'UPDATE_APPOINTMENT_STATUS')
                AND (al.details::text LIKE '%' || a.id::text || '%')
              ORDER BY al.created_at ASC
            ) audit_ordered) as audit_trail
    FROM appointments a
    WHERE a.patient_id = $1 
    ORDER BY a.appointment_date DESC
  `, [id]);
  
  // Sanitize for Client Component (Serialize Dates and ensure plain objects)
  const appointmentsData = (apptsRes.rows || []).filter(row => row && row.id).map(apt => {
    try {
      const safeISO = (d: any) => {
        if (!d) return null;
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      return {
        ...apt,
        appointment_date: safeISO(apt.appointment_date),
        audit_trail: (apt.audit_trail || []).map((log: any) => ({
          ...log,
          created_at: safeISO(log.created_at)
        }))
      };
    } catch (e) {
      console.error("Error serializing appointment:", apt?.id, e);
      return null;
    }
  }).filter((a): a is any => a !== null);

  const appointments = JSON.parse(JSON.stringify(appointmentsData));

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
              {appointments.map((apt: any) => (
                <HistoryItem key={apt.id} apt={apt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
