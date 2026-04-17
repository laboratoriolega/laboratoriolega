import type { Metadata } from "next";
import "./globals.css";
import { CalendarDays, Users, Stethoscope } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LEGA Laboratorio | Dashboard",
  description: "Sistema de gestión de turnos para LEGA Laboratorio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside className="glass-panel" style={{ 
            width: '260px', 
            padding: '2rem 1.5rem',
            margin: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.5rem' }}>
              <img 
                src="/logo.png" 
                alt="LEGA Laboratorio Logo" 
                style={{ width: '180px', height: 'auto', objectFit: 'contain' }} 
              />
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.1)',
                color: 'var(--primary)', fontWeight: 600,
                transition: 'all 0.2s ease'
              }}>
                <CalendarDays size={20} className="nav-icon" />
                <span>Turnos en Lista</span>
              </Link>
              <Link href="/pacientes" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                color: 'var(--text-muted)', fontWeight: 500,
                transition: 'all 0.2s ease'
              }}>
                <Users size={20} />
                <span>Pacientes</span>
              </Link>
              <Link href="/calendario" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                color: 'var(--text-muted)', fontWeight: 500,
                transition: 'all 0.2s ease'
              }}>
                <CalendarDays size={20} />
                <span>Calendario Mensual</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, padding: '1rem', paddingLeft: 0 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
