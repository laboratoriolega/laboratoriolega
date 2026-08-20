"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ListadosNav({ isAviola }: { isAviola?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  let tabs = [
    { name: "Pendientes", href: "/listados/pendientes" },
    { name: "Apross", href: "/listados/apross" },
    { name: "Requiere Facturación", href: "/listados/cobranzas" },
    { name: "Pago O. Social", href: "/listados/pago-obrasocial" },
    { name: "Notas", href: "/listados/notes" },
    { name: "Análisis que sí hacemos", href: "/listados/analisis" },
    { name: "Codigos de Sistema", href: "/listados/codigos" },
    { name: "OSDE", href: "/listados/osde" },
    { name: "Precios Facturacion", href: "/listados/precios" },
  ];

  if (isAviola) {
    tabs = tabs.filter(t => t.href === "/listados/analisis");
  }

  useEffect(() => {
    if (isAviola && pathname !== "/listados/analisis" && pathname.startsWith("/listados")) {
      router.push("/listados/analisis");
    }
  }, [isAviola, pathname, router]);

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
