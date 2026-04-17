import { getAppointments } from "@/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Activity, FileText } from "lucide-react";
import NewAppointmentModal from "@/components/NewAppointmentModal";
import DashboardViews from "@/components/DashboardViews";

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

      <DashboardViews appointments={appointments || []} error={error} />
    </div>
  );
}
