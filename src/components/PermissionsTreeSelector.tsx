import React, { useEffect, useState } from "react";
import { MODULES, DEFAULT_ROLE_PERMISSIONS, PermissionLevel, PermissionsConfig } from "@/lib/permissions";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Eye, Edit3, XCircle } from "lucide-react";

interface PermissionsTreeSelectorProps {
  role: string;
  initialPermissions?: PermissionsConfig;
  onChange: (permissions: PermissionsConfig) => void;
}

export default function PermissionsTreeSelector({ role, initialPermissions, onChange }: PermissionsTreeSelectorProps) {
  const [permissions, setPermissions] = useState<PermissionsConfig>(initialPermissions || {});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // When role changes, if no initialPermissions were given OR we want to reset to role defaults
    // Since we pass initialPermissions on edit, we only set defaults if it's empty (new user) or if role changes manually
    if (!initialPermissions || Object.keys(initialPermissions).length === 0) {
      setPermissions(DEFAULT_ROLE_PERMISSIONS[role] || {});
    }
  }, [role, initialPermissions]);

  useEffect(() => {
    onChange(permissions);
  }, [permissions]);

  const handleLevelChange = (id: string, level: PermissionLevel) => {
    setPermissions(prev => {
      const next = { ...prev };
      if (level === "none") {
        delete next[id];
      } else {
        next[id] = level;
      }
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderModule = (mod: any, level = 0) => {
    const isExpanded = expanded[mod.id];
    const currentLvl = permissions[mod.id] || "none";
    const hasChildren = mod.submodules && mod.submodules.length > 0;

    return (
      <div key={mod.id} style={{ marginLeft: `${level * 1.5}rem`, marginTop: '0.5rem' }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem", background: "var(--glass-bg)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: hasChildren ? "pointer" : "default" }} onClick={() => hasChildren && toggleExpand(mod.id)}>
            {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <div style={{ width: 16 }} />}
            <span style={{ fontWeight: level === 0 ? 600 : 500, fontSize: level === 0 ? "0.95rem" : "0.85rem", color: "var(--text-main)" }}>
              {mod.label}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleLevelChange(mod.id, "none")}
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem",
                background: currentLvl === "none" ? "rgba(239, 68, 68, 0.1)" : "transparent",
                color: currentLvl === "none" ? "var(--danger)" : "var(--text-muted)",
              }}
              title="Sin Acceso"
            >
              <XCircle size={14} /> <span style={{ display: currentLvl === "none" ? "inline" : "none" }}>Oculto</span>
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange(mod.id, "read")}
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem",
                background: currentLvl === "read" ? "rgba(14, 165, 233, 0.1)" : "transparent",
                color: currentLvl === "read" ? "var(--primary)" : "var(--text-muted)",
              }}
              title="Solo Lectura"
            >
              <Eye size={14} /> <span style={{ display: currentLvl === "read" ? "inline" : "none" }}>Ver</span>
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange(mod.id, "write")}
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem",
                background: currentLvl === "write" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                color: currentLvl === "write" ? "var(--success)" : "var(--text-muted)",
              }}
              title="Lectura y Escritura"
            >
              <Edit3 size={14} /> <span style={{ display: currentLvl === "write" ? "inline" : "none" }}>Editar</span>
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {mod.submodules.map((sub: any) => renderModule(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.02)" }}>
      <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>Permisos Personalizados</h4>
      {MODULES.map(mod => renderModule(mod))}
    </div>
  );
}
