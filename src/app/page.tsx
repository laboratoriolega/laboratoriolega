import { getAppointments } from "@/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Activity, FileText, X } from "lucide-react";
import NewAppointmentModal from "@/components/NewAppointmentModal";
import Link from "next/link";
import DashboardFilters from "@/components/DashboardFilters";
import DashboardTable from "@/components/DashboardTable";
import { Suspense } from "react";

export const revalidate = 0; // Disable cache for this page since data changes

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ status?: string, month?: string }> }) {
  const { data: allAppointments, error } = await getAppointments();
  const filters = await searchParams;

  // Filter logic
  let appointments = (allAppointments || []).filter(Boolean);
  if (filters.status) {
    appointments = appointments.filter((a: any) => a && a.status === filters.status);
  }
  if (filters.month) {
    appointments = appointments.filter((a: any) => {
      if (!a || !a.appointment_date) return false;
      const date = new Date(a.appointment_date);
      return (date.getMonth() + 1).toString().padStart(2, '0') === filters.month;
    });
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header section */}
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ minWidth: '200px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard de Turnos</h2>
          <p style={{ color: 'var(--text-muted)' }}>Bienvenido, gestioná todos los pacientes y citas aquí.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {(() => {
              try {
                return format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
              } catch (e) {
                return "Fecha actual";
              }
            })()}
          </p>
          <NewAppointmentModal />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <Link href="/" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', border: !filters.status ? '2px solid var(--primary)' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Calendar color="var(--primary)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total General</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{allAppointments?.length ?? 0}</h3>
          </div>
        </Link>

        <Link href="/?status=COMPLETADO" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'COMPLETADO' ? '2px solid var(--success)' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Activity color="var(--success)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Confirmados</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{allAppointments?.filter((a:any) => a?.status === 'COMPLETADO')?.length ?? 0}</h3>
          </div>
        </Link>

        <Link href="/?status=AGENDADO" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'AGENDADO' ? '2px solid var(--primary)' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Clock color="var(--danger)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Pendientes</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{allAppointments?.filter((a:any) => a?.status === 'AGENDADO')?.length ?? 0}</h3>
          </div>
        </Link>

        <Link href="/?status=CANCELADO" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'CANCELADO' ? '2px solid #94a3b8' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(148, 163, 184, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <X color="#94a3b8" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Cancelados</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{allAppointments?.filter((a:any) => a?.status === 'CANCELADO')?.length ?? 0}</h3>
          </div>
        </Link>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Agenda de Laboratorio ({filters.status || 'Todos'})</h3>
          <Suspense fallback={<div style={{ width: '300px', height: '36px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />}>
            <DashboardFilters currentMonth={filters.month} />
          </Suspense>
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>Error cargando base de datos: {error}</div>}

        <DashboardTable appointments={appointments} />
      </div>
    </div>
  );
}
