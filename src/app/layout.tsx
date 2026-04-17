import type { Metadata } from "next";
import "./globals.css";
import { CalendarDays, Users, Stethoscope } from "lucide-react";
import Link from "next/link";
import SidebarNav from "@/components/SidebarNav";

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

            <SidebarNav />
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
