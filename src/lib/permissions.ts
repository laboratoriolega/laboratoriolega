export type PermissionLevel = "read" | "write" | "none";

export interface PermissionsConfig {
  [moduleId: string]: PermissionLevel;
}

export const MODULES = [
  { id: "pacientes", label: "Pacientes" },
  { id: "ingresos", label: "Ingresos" },
  { id: "facturacion", label: "Facturación" },
  {
    id: "listados",
    label: "Listados",
    submodules: [
      { id: "listados:pendientes", label: "Pendientes" },
      { id: "listados:apross", label: "Apross" },
      { id: "listados:cobranzas", label: "Requiere Facturación (Cobranzas)" },
      { id: "listados:pago-obrasocial", label: "Pago O. Social" },
      { id: "listados:notes", label: "Notas" },
      { id: "listados:analisis", label: "Análisis que sí hacemos" },
      { id: "listados:codigos", label: "Códigos de Sistema" },
      { id: "listados:osde", label: "OSDE" },
      { id: "listados:precios", label: "Precios Facturación" },
    ]
  },
  { id: "resumen-medico", label: "Resumen Médico" },
  { id: "calendario", label: "Calendario" },
  { id: "totem", label: "Tótem" },
  { id: "admin-lega", label: "Administración Lega" },
  { id: "usuarios", label: "Usuarios / Perfil" }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionsConfig> = {
  admin: {
    "pacientes": "write",
    "ingresos": "write",
    "facturacion": "write",
    "listados": "write",
    "listados:pendientes": "write",
    "listados:apross": "write",
    "listados:cobranzas": "write",
    "listados:pago-obrasocial": "write",
    "listados:notes": "write",
    "listados:analisis": "write",
    "listados:codigos": "write",
    "listados:osde": "write",
    "listados:precios": "write",
    "resumen-medico": "write",
    "calendario": "write",
    "totem": "write",
    "admin-lega": "write",
    "usuarios": "write",
  },
  administracion: {
    "pacientes": "write",
    "ingresos": "write",
    "facturacion": "write",
    "listados": "read",
    "listados:pendientes": "write",
    "listados:apross": "write",
    "listados:cobranzas": "write",
    "listados:pago-obrasocial": "write",
    "listados:notes": "write",
    "listados:codigos": "read",
    "listados:precios": "read",
    "resumen-medico": "read",
    "calendario": "write",
    "totem": "read",
    "usuarios": "read",
  },
  gerente: {
    "pacientes": "read",
    "ingresos": "read",
    "facturacion": "read",
    "listados": "read",
    "listados:pendientes": "read",
    "listados:apross": "read",
    "listados:cobranzas": "write",
    "listados:pago-obrasocial": "read",
    "listados:notes": "read",
    "listados:analisis": "read",
    "listados:codigos": "read",
    "listados:osde": "read",
    "listados:precios": "read",
    "resumen-medico": "read",
    "calendario": "read",
    "admin-lega": "read",
    "usuarios": "read",
  },
  bioquimico: {
    "pacientes": "read",
    "ingresos": "read",
    "listados": "read",
    "listados:analisis": "read",
    "resumen-medico": "write",
    "usuarios": "read",
  },
  tecnico: {
    "pacientes": "read",
    "ingresos": "read",
    "usuarios": "read",
  }
};

export function hasPermission(userPermissions: PermissionsConfig, moduleId: string, requiredLevel: "read" | "write" = "read"): boolean {
  if (!userPermissions) return false;
  
  const level = userPermissions[moduleId];
  if (level === "write") return true;
  if (level === "read" && requiredLevel === "read") return true;
  
  if (moduleId.includes(':')) {
    const parentId = moduleId.split(':')[0];
    const parentLevel = userPermissions[parentId];
    if (parentLevel === "write") return true;
    if (parentLevel === "read" && requiredLevel === "read") return true;
  }
  
  // Implicit read access to parent if any child has access
  if (requiredLevel === "read") {
    for (const [key, val] of Object.entries(userPermissions)) {
      if (key.startsWith(moduleId + ':') && (val === "read" || val === "write")) {
        return true;
      }
    }
  }
  
  return false;
}
