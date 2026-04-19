import { getUsers } from "@/actions/users";
import { getAuditLogs } from "@/actions/audit";
import { ShieldCheck, History } from "lucide-react";
import CreateUserModal from "@/components/CreateUserModal";
import UserManagementClient from "@/components/UserManagementClient";
import AuditLogHistory from "@/components/AuditLogHistory";
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
        <section className="glass-panel" style={{ padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <History color="var(--accent)" /> Registro de Actividad
          </h3>
          {auditError && <p style={{ color: 'var(--danger)' }}>{auditError}</p>}
          <AuditLogHistory initialLogs={auditLogs || []} />
        </section>

      </div>
    </div>
  );
}
