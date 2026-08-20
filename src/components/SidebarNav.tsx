"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, UserCircle, Calendar, Wind, ListTodo, Car, ClipboardList, LogIn, Receipt } from "lucide-react";
import { PrestacionesIcon } from "./icons/PrestacionesIcon";
import { IngresosIcon } from "./icons/IngresosIcon";
import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

export default function SidebarNav({ session, isCollapsed }: { session?: any, isCollapsed?: boolean }) {
  const pathname = usePathname();

  const userRole = session?.role || 'staff';
  let customPermissions = typeof session?.custom_permissions === 'string' ? JSON.parse(session.custom_permissions) : (session?.custom_permissions || {});
  
  if (Object.keys(customPermissions).length === 0 && DEFAULT_ROLE_PERMISSIONS[userRole]) {
    customPermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  }
  const allNavItems = [
    { name: "Turnos en Lista", path: "/", icon: <CalendarDays size={20} />, id: "calendario" },
    { name: "Ingresos", path: "/ingresos", icon: <IngresosIcon size={20} />, id: "ingresos" },
    { name: "Pacientes", path: "/pacientes", icon: <Users size={20} />, id: "pacientes" },
    { name: "Turnos Aire", path: "/calendario-aire", icon: <Wind size={20} />, id: "calendario" },
    { name: "Domicilio", path: "/calendario-domicilio", icon: <Car size={20} />, id: "calendario" },
    { name: "Listados", path: "/listados", icon: <ListTodo size={20} />, id: "listados" },
    { name: "Facturacion", path: "/facturacion", icon: <Receipt size={20} />, id: "facturacion" },
    { name: "Prestaciones", path: "/prestaciones", icon: <PrestacionesIcon size={20} />, id: "admin-lega" },
    { name: "Admin Lega", path: "/admin-lega", icon: <Users size={20} />, id: "admin-lega" },
    { name: "Resumen Médico", path: "/resumen-medico", icon: <ClipboardList size={20} />, id: "resumen-medico" },
    { name: "Mi Perfil", path: "/perfil", icon: <UserCircle size={20} />, id: "usuarios" },
  ];

  // If no custom permissions are set, fallback to old logic for "admin" etc. 
  // But wait, they are set upon edit. 
  // For safety, if hasPermission returns true, we show it.
  const navItems = allNavItems.filter(item => {
    // Profiling module is always visible if they have login.
    if (item.id === "usuarios") return true; 
    
    // Check permission
    return hasPermission(customPermissions, item.id, "read");
  });

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {navItems.map((item) => {
        const isActive = item.path === "/"
          ? pathname === "/"
          : (pathname === item.path || pathname.startsWith(item.path + "/"));
        return (
          <Link
            key={item.path}
            href={item.path}
            title={isCollapsed ? item.name : ""}
            style={{
              display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '0.75rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: '0.75rem', borderRadius: '8px',
              background: isActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s ease',
              width: isCollapsed ? '44px' : 'auto',
              margin: isCollapsed ? '0 auto' : '0'
            }}
          >
            {item.icon}
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        )
      })}
    </nav>
  );
}
