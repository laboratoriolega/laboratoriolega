"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { getGlobalNotifications, markGlobalNotificationRead, markAllGlobalNotificationsRead } from "@/actions/ingresos";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Portal from "./Portal";

export default function NotificationsBell({ userRole }: { userRole: string }) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const router = useRouter();

  // Solo roles permitidos
  if (!['admin', 'gerente', 'bioquimico'].includes(userRole)) {
    return null;
  }

  const fetchNotifications = async () => {
    const res = await getGlobalNotifications();
    if (res.data) {
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => n.status === 'unread').length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    
    // Listen for local triggers to update instantly
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refresh-notifications', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, [userRole]);

  const handleMarkRead = async (id: number) => {
    await markGlobalNotificationRead(id);
    await fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllGlobalNotificationsRead();
    await fetchNotifications();
  };

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 10, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (popupRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'absolute', top: '3.25rem', right: '0.75rem', zIndex: 100 }}>
      <button 
        ref={buttonRef}
        onClick={toggleOpen}
        style={{
          background: unreadCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '50%', width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: unreadCount > 0 ? '#F59E0B' : 'var(--primary)',
          position: 'relative', transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        title="Notificaciones"
      >
        <Bell size={14} fill={unreadCount > 0 ? 'currentColor' : 'none'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#EF4444', color: 'white', fontSize: '0.55rem', fontWeight: 800,
            width: '14px', height: '14px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--table-sticky-bg)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <Portal>
          <div ref={popupRef} className="glass-panel" style={{
            position: 'fixed',  
            top: `${popupPos.top}px`, 
            left: `${popupPos.left}px`,
            width: '320px', maxHeight: '400px', overflowY: 'auto',
            zIndex: 99999, display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--glass-bg)' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Notificaciones</h4>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Check size={14} /> Marcar todo leído
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No tienes notificaciones
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => {
                     if(notif.status === 'unread') handleMarkRead(notif.id);
                     setIsOpen(false);
                     if(notif.link) router.push(notif.link);
                  }}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: notif.status === 'unread' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                    borderLeft: notif.status === 'unread' ? '3px solid #EF4444' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Clic para ir al detalle"
                >
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{format(new Date(notif.created_at), "dd/MM/yy HH:mm")}</span>
                    {notif.status === 'read' && (
                      <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        <Check size={10} /> Leído por {notif.first_reader || notif.read_by || 'Usuario'} primeramente
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
