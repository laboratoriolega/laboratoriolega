import { getUsers, deleteUser } from "@/actions/users";
import { getAuditLogs } from "@/actions/audit";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, UserPlus, Trash2, History } from "lucide-react";
import CreateUserModal from "@/components/CreateUserModal";
import UserManagementClient from "@/components/UserManagementClient";
import { getSession } from "@/lib/auth";

export const revalidate = 0;

export default async function UsuariosPage() {
  const { data: users, error: userError } = await getUsers();
  const { data: auditLogs, error: auditError } = await getAuditLogs();
  const session = await getSession() as any;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Administración de Usuarios</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestioná el personal y visualizá los registros de actividad.</p>
        </div>
        <CreateUserModal />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* User Management List */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <ShieldCheck color="var(--primary)" /> Staff del Laboratorio
          </h3>
          {userError && <p style={{ color: 'var(--danger)' }}>{userError}</p>}
          <UserManagementClient initialUsers={users || []} currentUserId={session?.id} />
        </section>

        {/* Audit Log / History */}
        <section className="glass-panel" style={{ padding: '2rem', maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <History color="var(--accent)" /> Registro de Actividad
          </h3>
          {auditError && <p style={{ color: 'var(--danger)' }}>{auditError}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {auditLogs?.map((log: any) => (
              <div key={log.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                   <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{log.username}</span>
                   <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                     {format(new Date(log.created_at), "d MMM, HH:mm", { locale: es })}
                   </span>
                </div>
                <p style={{ margin: 0, fontWeight: 500 }}>{log.action.replace(/_/g, ' ')}</p>
                {log.details && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {JSON.stringify(log.details)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
