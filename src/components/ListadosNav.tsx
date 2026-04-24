"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ListadosNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Pendientes", href: "/listados/pendientes" },
    { name: "Cobranzas", href: "/listados/cobranzas" },
    { name: "Indicaciones WS", href: "/listados/indicaciones" },
    { name: "Codigos de Sistema", href: "/listados/codigos" },
    { name: "Precios Facturacion", href: "/listados/precios" },
  ];

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
