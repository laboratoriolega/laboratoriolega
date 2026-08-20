import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

const LISTADOS_TABS = [
  { href: "/listados/pendientes", id: "listados:pendientes" },
  { href: "/listados/apross", id: "listados:apross" },
  { href: "/listados/cobranzas", id: "listados:cobranzas" },
  { href: "/listados/pago-obrasocial", id: "listados:pago-obrasocial" },
  { href: "/listados/notes", id: "listados:notes" },
  { href: "/listados/analisis", id: "listados:analisis" },
  { href: "/listados/codigos", id: "listados:codigos" },
  { href: "/listados/osde", id: "listados:osde" },
  { href: "/listados/precios", id: "listados:precios" },
];

export default async function ListadosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let perms = session.custom_permissions;
  if (!perms && session.role) {
    perms = DEFAULT_ROLE_PERMISSIONS[session.role] || {};
  }
  
  for (const tab of LISTADOS_TABS) {
    if (hasPermission(perms, tab.id, "read")) {
      redirect(tab.href);
    }
  }

  // Fallback si no tiene permisos para ningun submodulo
  redirect("/");
}
