import { getPatients } from "@/actions/patients";
import { Users } from "lucide-react";
import { format } from "date-fns";
import PatientFilters from "@/components/PatientFilters";
import PatientTableActions from "@/components/PatientTableActions";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Todos los Pacientes ({patients.length})</h3>
          <Suspense fallback={<div style={{ width: '300px', height: '40px', background: 'var(--glass-bg)', borderRadius: '8px' }} />}>
            <PatientFilters />
          </Suspense>
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>Error cargando base de datos: {error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>DNI</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Teléfono</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Obra Social</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Fecha Nacimiento</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Email</th>
                <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
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
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '30px', height: '30px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                          {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        {p.name || 'Sin nombre'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.dni}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{p.phone || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500 }}>
                        {p.health_insurance}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
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
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.email || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <PatientTableActions patient={p} />
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
