"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, UserCircle, ShieldCheck } from "lucide-react";

export default function SidebarNav({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Turnos en Lista", path: "/", icon: <CalendarDays size={20} /> },
    { name: "Pacientes", path: "/pacientes", icon: <Users size={20} /> },
    { name: "Calendario Mensual", path: "/calendario", icon: <CalendarDays size={20} /> },
  ];

  if (userRole === 'admin') {
    navItems.push({ name: "Usuarios", path: "/usuarios", icon: <ShieldCheck size={20} /> });
  }

  navItems.push({ name: "Mi Perfil", path: "/perfil", icon: <UserCircle size={20} /> });

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link 
            key={item.path}
            href={item.path} 
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: isActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s ease'
             }}
          >
             {item.icon}
             <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  );
}
