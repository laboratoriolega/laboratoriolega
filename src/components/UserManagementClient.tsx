"use client";

import { useState } from "react";
import { Trash2, Edit, ShieldCheck } from "lucide-react";
import { deleteUser } from "@/actions/users";
import EditUserModal from "./EditUserModal";

export default function UserManagementClient({ initialUsers, currentUserId }: { initialUsers: any[], currentUserId: number }) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Usuario</th>
              <th style={{ padding: '1rem' }}>Nombre Completo</th>
              <th style={{ padding: '1rem' }}>Rol</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }} className="hoverable-row">
                <td style={{ padding: '1rem', fontWeight: 600 }}>@{u.username}</td>
                <td style={{ padding: '1rem' }}>{u.full_name || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    textTransform: 'capitalize', 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: u.role === 'admin' ? '#fee2e2' : '#f1f5f9',
                    color: u.role === 'admin' ? '#ef4444' : '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {u.role === 'admin' && <ShieldCheck size={12} />}
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => { setSelectedUser(u); setIsEditOpen(true); }}
                      style={{ color: 'var(--primary)', border: 'none', background: 'rgba(14, 165, 233, 0.1)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}
                    >
                      <Edit size={16} />
                    </button>
                    
                    {u.id !== currentUserId && (
                      <button 
                        onClick={async () => {
                          if (confirm(`¿Estás seguro de eliminar al usuario @${u.username}?`)) {
                            await deleteUser(u.id);
                          }
                        }}
                        style={{ color: 'var(--danger)', border: 'none', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditUserModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        user={selectedUser} 
      />
    </>
  );
}
