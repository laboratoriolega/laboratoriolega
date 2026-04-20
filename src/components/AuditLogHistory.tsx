"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Loader2, User } from "lucide-react";
import { getAuditLogs, getAuditUsers } from "@/actions/audit";
import { formatAuditLog } from "@/lib/audit-format";

export default function AuditLogHistory({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [username, setUsername] = useState<string>('all');
  const [users, setUsers] = useState<string[]>([]);

  // Load available users on mount
  useEffect(() => {
    getAuditUsers().then(res => { if (res.data) setUsers(res.data); });
  }, []);

  const fetchLogs = async (p: string, d: string = '', u: string = username) => {
    setLoading(true);
    const res = await getAuditLogs({ period: p, date: d, username: u === 'all' ? undefined : u });
    if (res.data) setLogs(res.data);
    setLoading(false);
  };

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p !== 'date') {
      fetchLogs(p, '', username);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setCustomDate(d);
    if (d) fetchLogs('date', d, username);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const u = e.target.value;
    setUsername(u);
    fetchLogs(period, customDate, u);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Filter Bar */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem', 
        padding: '1rem', 
        background: 'rgba(14, 165, 233, 0.05)', 
        borderRadius: '12px',
        border: '1px solid rgba(14, 165, 233, 0.1)'
      }}>
        {/* Period filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Todo' },
            { id: 'week', label: '7 días' },
            { id: 'month', label: '30 días' },
            { id: 'date', label: 'Por Fecha' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                background: period === p.id ? 'var(--primary)' : 'var(--glass-bg)',
                color: period === p.id ? 'white' : 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                border: period === p.id ? 'none' : '1px solid var(--glass-border)'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* User + Date combined row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* User filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={14} color="var(--primary)" />
            <select
              value={username}
              onChange={handleUserChange}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'var(--glass-bg)',
                border: username !== 'all' ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: username !== 'all' ? 600 : 400,
              }}
            >
              <option value="all">Todos los usuarios</option>
              {users.map(u => (
                <option key={u} value={u}>@{u}</option>
              ))}
            </select>
          </div>

          {/* Custom date picker */}
          {period === 'date' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
              <Calendar size={14} color="var(--primary)" />
              <input 
                type="date" 
                value={customDate}
                onChange={handleDateChange}
                style={{
                  padding: '0.35rem',
                  borderRadius: '6px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

      </div>

      {/* Logs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
        {loading && (
          <div style={{ 
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', 
            backdropFilter: 'blur(2px)',
            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '10px'
          }}>
            <Loader2 className="animate-spin" color="var(--primary)" />
          </div>
        )}

        {logs.length === 0 && !loading && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No se encontraron actividades para este período.
          </p>
        )}

        {logs.map((log: any) => (
          <div key={log.id} style={{ 
            padding: '0.85rem', 
            background: 'var(--glass-bg)', 
            borderRadius: '10px', 
            fontSize: '0.85rem',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
               <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>
                 @{log.username}
               </span>
               <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 500 }}>
                 {format(new Date(log.created_at), "d MMM, HH:mm", { locale: es })}
               </span>
            </div>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.4, fontSize: '0.8rem', opacity: 0.9 }}>
              {formatAuditLog(log)}
            </p>
            {log.action.includes('CREATE_APPOINTMENT') && log.details?.dni && (
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                DNI: {log.details.dni}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
