"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";
import { logoutAction } from "@/actions/auth";

export default function MobileNav({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="show-mobile" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--glass-border)',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="LEGA" className="logo-light" style={{ height: '30px' }} />
          <img src="/logoB.png" alt="LEGA" className="logo-dark" style={{ height: '30px' }} />
        </div>
        <button className="show-mobile" onClick={() => setIsOpen(true)} style={{ color: 'var(--text-main)', padding: '0.5rem' }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 101,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-100%',
        bottom: 0,
        width: '80%',
        maxWidth: '300px',
        background: 'var(--bg-gradient-start)',
        zIndex: 102,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <img src="/logo.png" alt="LEGA" className="logo-light" style={{ height: '24px' }} />
             <img src="/logoB.png" alt="LEGA" className="logo-dark" style={{ height: '24px' }} />
          </div>
          <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-main)' }}>
            <X size={24} />
          </button>
        </div>

        <ThemeToggle />
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }} onClick={() => setIsOpen(false)}>
           <SidebarNav userRole={session.role} />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
              {(session?.username || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>{session?.username}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{session?.role}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" style={{ 
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              padding: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', 
              borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', border: 'none'
            }}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
      
      {/* Spacer for the fixed top bar */}
      <div className="show-mobile" style={{ height: '50px' }} />
    </>
  );
}
