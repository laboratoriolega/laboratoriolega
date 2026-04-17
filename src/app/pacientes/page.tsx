import { getPatients } from "@/actions/patients";
import { Users, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const { data: patients, error } = await getPatients();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Directorio de Pacientes</h2>
          <p style={{ color: 'var(--text-muted)' }}>Lista única de todos los pacientes en tu sistema.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Todos los Pacientes</h3>
          <input 
            type="text" 
            placeholder="Buscar por DNI o Nombre..." 
            className="input-field"
            style={{ width: '300px' }}
          />
        </div>

        {error && <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>Error cargando base de datos: {error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>DNI</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Obra Social</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Fecha Nacimiento</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {!patients || patients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Users size={48} style={{ opacity: 0.5 }} />
                      <p>Todavía no tienes pacientes registrados en el sistema.</p>
                      <br />
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }} 
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '30px', height: '30px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.dni}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500 }}>
                        {p.health_insurance}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.birth_date ? new Date(p.birth_date).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.email || '-'}</td>
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
