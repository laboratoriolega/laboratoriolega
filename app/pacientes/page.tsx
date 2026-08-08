import { getPatients } from "@/actions/patients";
import { Users } from "lucide-react";
import { format } from "date-fns";
import PatientFilters from "@/components/PatientFilters";
import PatientTableActions from "@/components/PatientTableActions";
import NewPatientButton from "@/components/NewPatientButton";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession() as any;
  const userRole: string = session?.role || 'staff';
  const { data: allPatients, error } = await getPatients();
  const { q } = await searchParams;

  let patients = allPatients || [];
  if (q) {
    const query = q.toLowerCase();
    patients = patients.filter((p: any) => 
      p.name?.toLowerCase().includes(query) || 
      p.dni?.toLowerCase().includes(query) ||
      p.health_insurance?.toLowerCase().includes(query)
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ minWidth: '200px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Directorio de Pacientes</h2>
          <p style={{ color: 'var(--text-muted)' }}>Lista única de todos los pacientes en tu sistema.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Todos los Pacientes ({patients.length})</h3>
            <NewPatientButton />
          </div>
          <Suspense fallback={<div style={{ width: '300px', height: '40px', background: 'var(--glass-bg)', borderRadius: '8px' }} />}>
            <PatientFilters />
          </Suspense>
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>Error cargando base de datos: {error}</div>}

        <div style={{ overflowX: 'scroll' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Nombre</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>DNI</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Teléfono</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Obra Social</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Nacimiento</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Email</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!patients || patients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Users size={48} style={{ opacity: 0.5 }} />
                      <p>{q ? "No se encontraron pacientes para tu búsqueda." : "Todavía no tienes pacientes registrados en el sistema."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((p: any) => (
                  <tr key={p.id} className="hoverable-row" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '26px', height: '26px', flexShrink: 0, background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                          {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        {p.name || 'Sin nombre'}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.dni}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.phone || '-'}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {p.health_insurance}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {(() => {
                        try {
                          if (!p.birth_date) return "-";
                          const d = new Date(p.birth_date);
                          if (isNaN(d.getTime())) return "Fecha inválida";
                          return format(d, "dd/MM/yyyy");
                        } catch (e) {
                          return '-';
                        }
                      })()}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email || ''}>
                      {p.email || '-'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                      <PatientTableActions patient={p} userRole={userRole} />
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
