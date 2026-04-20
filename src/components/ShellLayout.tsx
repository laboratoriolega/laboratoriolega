"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";
import { logoutAction } from "@/actions/auth";

interface ShellLayoutProps {
  children: React.ReactNode;
  session: any;
  userData: any;
}

export default function ShellLayout({ children, session, userData }: ShellLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userDisplayName = userData?.full_name || session?.username || 'Usuario';
  const userRole = userData?.role || session?.role || 'staff';
  const avatarUrl = userData?.avatar_url;
  const updatedTime = userData?.updated_at ? new Date(userData.updated_at).getTime() : Date.now();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        width: isCollapsed ? '80px' : '22rem',
        padding: isCollapsed ? '1.5rem 0.75rem' : '2.5rem 1.5rem',
        margin: '1rem',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
        position: 'relative'
      }}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '50%', width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--primary)', zIndex: 100,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo Section */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', 
          gap: '0.75rem', paddingBottom: '2rem', height: '80px', paddingTop: isCollapsed ? '1rem' : '0'
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: '100%', maxWidth: '14rem', height: 'auto', maxHeight: '70px', objectFit: 'contain' }} />
              <img src="/logoB.png" alt="Logo" className="logo-dark" style={{ width: '100%', maxWidth: '14rem', height: 'auto', maxHeight: '70px', objectFit: 'contain' }} />
            </div>
          ) : (
            <img 
              src="/logofavicon.png" 
              alt="Logo" 
              style={{ 
                width: '45px', height: '45px', objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} 
            />
          )}
        </div>

        <div style={{ display: isCollapsed ? 'none' : 'block' }}>
           <ThemeToggle />
        </div>
        
        <div style={{ marginTop: isCollapsed ? '1rem' : '0' }}>
          <SidebarNav userRole={userRole} isCollapsed={isCollapsed} />
        </div>

        {/* User Profile Section */}
        <div style={{ 
          marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', alignItems: isCollapsed ? 'center' : 'stretch', gap: '1rem'
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', 
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <div style={{ 
              width: isCollapsed ? '40px' : '45px', height: isCollapsed ? '40px' : '45px', 
              background: 'var(--primary)', borderRadius: '50%', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 'bold', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--glass-border)',
              transition: 'all 0.3s ease'
            }}>
              {avatarUrl ? (
                <img src={`/api/avatar/${userData.id}?v=${updatedTime}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userDisplayName.charAt(0).toUpperCase()
              )}
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {userDisplayName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>{userRole}</p>
              </div>
            )}
          </div>

          <form action={logoutAction}>
            <button type="submit" title="Cerrar Sesión" style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isCollapsed ? '0' : '0.5rem',
              padding: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--danger)',
              borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
            }}>
              <LogOut size={16} />
              {!isCollapsed && "Cerrar Sesión"}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        height: '100vh',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ minHeight: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
