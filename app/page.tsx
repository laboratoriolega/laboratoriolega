import { getAppointments } from "@/actions/appointments";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { Calendar, Clock, Activity, FileText, X, Car } from "lucide-react";
import NewAppointmentModal from "@/components/NewAppointmentModal";
import Link from "next/link";
import DashboardFilters from "@/components/DashboardFilters";
import DashboardTable from "@/components/DashboardTable";
import KpiDateFilter from "@/components/KpiDateFilter";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const revalidate = 0; // Disable cache for this page since data changes

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ status?: string, date?: string, q?: string, kpiStart?: string, kpiEnd?: string, kpiCustom?: string }> }) {
  const session = await getSession() as any;
  if (!session) {
    redirect('/login');
  }

  const userRole = session?.role || 'staff';
  let customPermissions = typeof session?.custom_permissions === 'string' ? JSON.parse(session.custom_permissions) : (session?.custom_permissions || {});
  
  if (Object.keys(customPermissions).length === 0 && DEFAULT_ROLE_PERMISSIONS[userRole]) {
    customPermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  }

  const canViewLista = hasPermission(customPermissions, "calendario:lista", "read");
  if (!canViewLista) {
    const allNavItems = [
      { path: "/ingresos", id: "ingresos" },
      { path: "/pacientes", id: "pacientes" },
      { path: "/calendario-aire", id: "calendario:aire" },
      { path: "/calendario-pab", id: "calendario:pab" },
      { path: "/calendario-domicilio", id: "calendario:domicilio" },
      { path: "/listados", id: "listados" },
      { path: "/facturacion", id: "facturacion" },
      { path: "/admin-lega", id: "admin-lega" },
      { path: "/resumen-medico", id: "resumen-medico" },
      { path: "/perfil", id: "usuarios" },
    ];
    
    for (const item of allNavItems) {
      if (item.id === "usuarios" || hasPermission(customPermissions, item.id, "read")) {
        redirect(item.path);
      }
    }
    redirect('/perfil');
  }

  const { data: allAppointments, error } = await getAppointments();
  const filters = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDate = filters.date || today;

  const kpiStart = filters.kpiStart || format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
  const kpiEnd = filters.kpiEnd || format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

  const kpiAppointments = (allAppointments || []).filter((a: any) => {
    if (!a || !a.appointment_date) return false;
    const aptDate = format(new Date(a.appointment_date), "yyyy-MM-dd");
    return aptDate >= kpiStart && aptDate <= kpiEnd;
  });

  // Filter logic: Exclude Domicilio from the main Laboratory table
  let appointments = (allAppointments || []).filter(a => a && !a.is_domicilio);
  
  if (filters.status) {
    if (filters.status === 'INDICACIONES') {
      appointments = appointments.filter((a: any) => a && a.analysis_type === 'Test de aire');
    } else {
      appointments = appointments.filter((a: any) => a && a.status === filters.status);
    }
  }
  
  // Filter by exact date (default to today if no date provided)
  appointments = appointments.filter((a: any) => {
    if (!a || !a.appointment_date) return false;
    const aptDate = format(new Date(a.appointment_date), "yyyy-MM-dd");
    return aptDate === selectedDate;
  });

  if (filters.q) {
    const normalize = (s: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    const query = normalize(filters.q);
    appointments = appointments.filter((a: any) => 
      normalize(a.name).includes(query) || 
      normalize(a.dni).includes(query) ||
      normalize(a.health_insurance).includes(query)
    );
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1rem' }}>
        <Suspense fallback={<div style={{ width: '300px', height: '42px', background: 'var(--glass-bg)', borderRadius: '12px' }} />}>
          <KpiDateFilter />
        </Suspense>
      </div>

      {/* Stats Cards */}
      <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
        <Link href="/" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', border: !filters.status ? '2px solid var(--primary)' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Calendar color="var(--primary)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total General</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpiAppointments?.length ?? 0}</h3>
          </div>
        </Link>

        <Link href="/?status=COMPLETADO" className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'COMPLETADO' ? '2px solid var(--success)' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px' }}>
            <Activity color="var(--success)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Confirmados</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpiAppointments?.filter((a:any) => a?.status === 'COMPLETADO')?.length ?? 0}</h3>
          </div>
        </Link>

        <Link href="/?status=AGENDADO" className="glass-panel" style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'AGENDADO' ? '2px solid var(--primary)' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
            <Clock color="var(--danger)" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>Pendientes</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{kpiAppointments?.filter((a:any) => a?.status === 'AGENDADO')?.length ?? 0}</h3>
          </div>
        </Link>

        <Link href="/?status=INDICACIONES" className="glass-panel" style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'INDICACIONES' ? '2px solid #4a90e2' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(74, 144, 226, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
            <Activity color="#4a90e2" size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Indicaciones (Aire)</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{kpiAppointments?.filter((a:any) => a?.analysis_type === 'Test de aire')?.length ?? 0}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>({kpiAppointments?.filter((a:any) => a?.analysis_type === 'Test de aire' && !a?.indications_sent)?.length ?? 0} p.)</span>
            </div>
          </div>
        </Link>

        <Link href="/?status=CANCELADO" className="glass-panel" style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', border: filters.status === 'CANCELADO' ? '2px solid #94a3b8' : '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(148, 163, 184, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
            <X color="#94a3b8" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>Cancelados</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{kpiAppointments?.filter((a:any) => a?.status === 'CANCELADO')?.length ?? 0}</h3>
          </div>
        </Link>
        <Link href="/calendario-domicilio" className="glass-panel" style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', border: '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
            <Car color="#f59e0b" size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>Domicilio</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{kpiAppointments?.filter((a:any) => a?.is_domicilio)?.length ?? 0}</h3>
          </div>
        </Link>
      </div>


      {/* Main Table */}
      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Agenda de Laboratorio ({filters.status || 'Todos'})</h3>
          <Suspense fallback={<div style={{ width: '300px', height: '36px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />}>
            <DashboardFilters />
          </Suspense>
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>Error cargando base de datos: {error}</div>}

        <DashboardTable appointments={appointments} currentFilter={filters.status} />
      </div>
    </div>
  );
}
