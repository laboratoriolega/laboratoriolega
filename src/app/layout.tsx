import type { Metadata } from "next";
import "./globals.css";
import { LogOut } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import ThemeToggle from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export const metadata: Metadata = {
  title: "LEGA Laboratorio | Sistema de Gestión",
  description: "Sistema profesional de gestión de turnos para laboratorios.",
  icons: {
    icon: "/logofavicon.png",
    apple: "/logofavicon.png",
  },
  openGraph: {
    title: "LEGA Laboratorio | Sistema de Gestión",
    description: "Gestión avanzada de turnos y pacientes para LEGA Laboratorio.",
    url: "https://legalaboratorio.vercel.app", // Fallback URL
    siteName: "LEGA Laboratorio",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "LEGA Laboratorio Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession() as any;

  if (!session) {
    return (
      <html lang="es">
        <head>
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              try {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })()
          `}} />
        </head>
        <body>
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {}
          })()
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <MobileNav session={session} />
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {/* Sidebar */}
          <aside className="glass-panel" style={{ 
            width: '22rem', 
            padding: '2.5rem 1.5rem',
            margin: '1rem',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '2rem' }}>
              <img 
                src="/logo.png" 
                alt="LEGA Laboratorio Logo" 
                className="logo-light"
                style={{ width: '15rem', height: 'auto', objectFit: 'contain' }} 
              />
              <img 
                src="/logoB.png" 
                alt="LEGA Laboratorio Logo" 
                className="logo-dark"
                style={{ width: '15rem', height: 'auto', objectFit: 'contain' }} 
              />
            </div>

            <ThemeToggle />
            <SidebarNav userRole={session.role} />

            {/* Profile & Logout */}
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {(session?.username || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden' }}>{session?.username || 'Usuario'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>Rol: {session?.role || 'staff'}</p>
                </div>
              </div>
              
              <form action={logoutAction}>
                <button type="submit" style={{ 
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                  padding: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--danger)', 
                  borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                }}>
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </form>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ 
            flex: 1, 
            padding: '1rem', 
            overflowY: 'auto',
            height: '100vh'
          }}>
            <div style={{ minHeight: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
