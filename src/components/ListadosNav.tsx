"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

export default function ListadosNav({ customPermissions, role }: { customPermissions?: any, role?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  let perms = customPermissions;
  if (typeof perms === "string") perms = JSON.parse(perms);
  if (!perms && role) {
    perms = DEFAULT_ROLE_PERMISSIONS[role] || {};
  }
  
  let tabs = [
    { name: "Pendientes", href: "/listados/pendientes", id: "listados:pendientes" },
    { name: "Apross", href: "/listados/apross", id: "listados:apross" },
    { name: "Requiere Facturación", href: "/listados/cobranzas", id: "listados:cobranzas" },
    { name: "Pago O. Social", href: "/listados/pago-obrasocial", id: "listados:pago-obrasocial" },
    { name: "Notas", href: "/listados/notes", id: "listados:notas" },
    { name: "Análisis que sí hacemos", href: "/listados/analisis", id: "listados:analisis" },
    { name: "Codigos de Sistema", href: "/listados/codigos", id: "listados:codigos" },
    { name: "OSDE", href: "/listados/osde", id: "listados:osde" },
    { name: "Precios Facturacion", href: "/listados/precios", id: "listados:precios" },
  ];

  tabs = tabs.filter(t => hasPermission(perms, t.id, "read"));

  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem", overflowX: "auto" }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: isActive ? "var(--primary)" : "transparent",
              color: isActive ? "white" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
