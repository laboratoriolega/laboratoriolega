import { getAppointments } from "@/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Activity, FileText } from "lucide-react";
import NewAppointmentModal from "@/components/NewAppointmentModal";

export const revalidate = 0; // Disable cache for this page since data changes

export default async function DashboardPage() {
  const { data: appointments, error } = await getAppointments();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header section */}
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard de Turnos</h2>
          <p style={{ color: 'var(--text-muted)' }}>Bienvenido, gestioná todos los pacientes y citas aquí.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <NewAppointmentModal />
        </div>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Calendar color="var(--primary)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Turnos Hoy</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{appointments?.length || 0}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Activity color="var(--success)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Asistencias Confirmadas</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>0</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Clock color="var(--danger)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Turnos Pendientes</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{appointments?.length || 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Agenda de Laboratorio</h3>
          <input 
            type="text" 
            placeholder="Buscar por paciente o DNI..." 
            className="input-field"
            style={{ width: '300px' }}
          />
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>Error cargando base de datos: {error}</div>}

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
              {!appointments || appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <FileText size={48} style={{ opacity: 0.5 }} />
                      <p>No hay turnos registrados aún. El Excel está en blanco.</p>
                      <button className="btn-primary" style={{ marginTop: '0.5rem' }}>Crear Primer Turno</button>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((apt: any) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }} 
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="var(--primary)" />
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{format(new Date(apt.appointment_date), "dd/MM/yyyy")}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 600 }}>{apt.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {apt.dni}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem' }}>
                        {apt.health_insurance}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--accent)', fontWeight: 500 }}>{apt.analysis_type}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: apt.status === 'AGENDADO' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                        color: apt.status === 'AGENDADO' ? 'var(--primary)' : 'var(--success)', 
                        padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                        {apt.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {apt.observations || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
