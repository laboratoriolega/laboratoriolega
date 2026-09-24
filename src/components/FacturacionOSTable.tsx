"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { createFacturacionOS, updateFacturacionOS, deleteFacturacionOS, deleteFacturacionOSDocument, updateFacturacionOSSeguimiento } from "@/actions/listados";
import { format } from "date-fns";
import { es } from 'date-fns/locale/es';
import { Plus, Trash2, Save, X, Search, FileText, Upload, Pencil } from "lucide-react";

const OBRAS_SOCIALES = ['OSDE', 'SWISS MEDICAL', 'GALENO', 'MEDIFE', 'CIBIC', 'METABOLOMICA', 'FEDERACION', 'ASOCIACION'];

const SEGUIMIENTO_OPTIONS = ['Falta Pagos', 'Pagado'];

const seguimientoStyle = (val: string) => ({
  padding: "0.25rem 0.6rem",
  borderRadius: "6px",
  fontSize: "0.8rem",
  fontWeight: 600,
  display: "inline-block",
  background: val === 'Pagado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
  color: val === 'Pagado' ? '#10B981' : '#EF4444',
  border: val === 'Pagado' ? '1px solid #10B981' : '1px solid #EF4444',
});

interface Props {
  allData: Record<string, any[]>;
  userRole: string;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function FacturacionOSTable({ allData, userRole }: Props) {
  const [activeOS, setActiveOS] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('facturacion_active_os') || OBRAS_SOCIALES[0];
    }
    return OBRAS_SOCIALES[0];
  });
  
  const [dataByOS, setDataByOS] = useState<Record<string, any[]>>(allData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [openDocDropdown, setOpenDocDropdown] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    localStorage.setItem('facturacion_active_os', activeOS);
  }, [activeOS]);

  const canEditSeguimiento = userRole === 'admin' || userRole === 'gerente';
  const items = dataByOS[activeOS] || [];

  // Derive available years from current OS data
  const availableYears = Array.from(new Set(
    items.map(it => (it.month_group || "").substring(0, 4)).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));

  const filteredItems = items.filter(it => {
    const mg: string = it.month_group || format(new Date(it.fecha), "yyyy-MM");
    if (filterYear && !mg.startsWith(filterYear)) return false;
    if (filterMonth && mg.substring(5, 7) !== filterMonth) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (it.nro_factura || "").toLowerCase().includes(q) ||
        (it.detalle || "").toLowerCase().includes(q) ||
        (it.seguimiento || "").toLowerCase().includes(q) ||
        (it.fecha || "").includes(q)
      );
    }
    return true;
  });

  const groups = filteredItems.reduce((acc: any, item: any) => {
    const month = item.month_group || format(new Date(item.fecha), "yyyy-MM");
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const resetNewForm = () => {
    setFiles([]);
    if (formRef.current) formRef.current.reset();
  };

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este registro?")) return;
    const res = await deleteFacturacionOS(id);
    if (!res.error) {
      setDataByOS(prev => ({
        ...prev,
        [activeOS]: (prev[activeOS] || []).filter(it => it.id !== id)
      }));
    } else {
      alert(res.error);
    }
  }

  async function handleQuickSeguimiento(id: number, seguimiento: string) {
    const res = await updateFacturacionOSSeguimiento(id, seguimiento);
    if (!res.error) {
      setDataByOS(prev => ({
        ...prev,
        [activeOS]: (prev[activeOS] || []).map(it => it.id === id ? { ...it, seguimiento } : it)
      }));
    } else {
      alert(res.error);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* OS Sub-nav */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
        {OBRAS_SOCIALES.map(os => (
          <button
            key={os}
            onClick={() => { setActiveOS(os); setSearchTerm(""); setFilterYear(""); setFilterMonth(""); setOpenDocDropdown(null); }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              transition: "all 0.2s",
              background: activeOS === os ? "var(--primary)" : "var(--glass-bg)",
              color: activeOS === os ? "white" : "var(--text-muted)",
              boxShadow: activeOS === os ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
            }}
          >
            {os}
            {(dataByOS[os] || []).length > 0 && (
              <span style={{
                marginLeft: "0.4rem", padding: "0.1rem 0.4rem", borderRadius: "10px",
                background: activeOS === os ? "rgba(255,255,255,0.25)" : "rgba(14,165,233,0.1)",
                color: activeOS === os ? "white" : "var(--primary)",
                fontSize: "0.75rem"
              }}>
                {(dataByOS[os] || []).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters + New button */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Row 1: year selector + search + new button */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setFilterMonth(""); }}
            className="input-field"
            style={{ width: "auto", minWidth: "110px" }}
          >
            <option value="">Todos los años</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <div style={{ position: "relative", flex: 1, maxWidth: "340px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar factura, detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          {(filterYear || filterMonth || searchTerm) && (
            <button
              onClick={() => { setFilterYear(""); setFilterMonth(""); setSearchTerm(""); }}
              style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "0.4rem 0.8rem", cursor: "pointer" }}
            >
              Limpiar
            </button>
          )}

          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => { resetNewForm(); setShowNewModal(true); }}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Plus size={18} /> Nueva Facturacion
            </button>
          </div>
        </div>

        {/* Row 2: month buttons */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {MONTH_NAMES.map((name, i) => {
            const mm = String(i + 1).padStart(2, "0");
            const isActive = filterMonth === mm;
            // count records for this month (respecting year filter)
            const count = items.filter(it => {
              const mg: string = it.month_group || "";
              if (filterYear && !mg.startsWith(filterYear)) return false;
              return mg.substring(5, 7) === mm;
            }).length;
            return (
              <button
                key={mm}
                onClick={() => setFilterMonth(isActive ? "" : mm)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "20px",
                  border: isActive ? "none" : "1px solid var(--glass-border)",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.8rem",
                  transition: "all 0.15s",
                  background: isActive ? "var(--primary)" : count > 0 ? "var(--glass-bg)" : "transparent",
                  color: isActive ? "white" : count > 0 ? "var(--text-main)" : "var(--text-muted)",
                  opacity: count === 0 && !isActive ? 0.45 : 1,
                }}
              >
                {name.substring(0, 3)}
                {count > 0 && (
                  <span style={{
                    marginLeft: "0.35rem",
                    padding: "0.05rem 0.35rem",
                    borderRadius: "10px",
                    fontSize: "0.7rem",
                    background: isActive ? "rgba(255,255,255,0.25)" : "rgba(14,165,233,0.15)",
                    color: isActive ? "white" : "var(--primary)",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* New Entry Modal */}
      {showNewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div className="glass-panel shadow-premium" style={{ width: "100%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto", padding: "2.5rem", position: "relative", borderRadius: "24px" }}>
            <button onClick={() => setShowNewModal(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={24} />
            </button>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem", fontWeight: 900 }}>Nueva Facturacion</h3>
            <p style={{ margin: "0 0 2rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>{activeOS}</p>

            <form
              ref={formRef}
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const fd = new FormData(e.currentTarget);
                files.forEach(f => fd.append("documents", f));
                startTransition(async () => {
                  try {
                    const res = await createFacturacionOS(fd) as any;
                    if (res?.error) {
                      alert("Error: " + res.error);
                    } else {
                      setShowNewModal(false);
                      window.location.reload();
                    }
                  } finally {
                    setLoading(false);
                  }
                });
              }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
            >
              <input type="hidden" name="obra_social" value={activeOS} />

              <div>
                <label className="label-premium">Fecha</label>
                <input name="fecha" type="date" required className="input-field" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>

              <div>
                <label className="label-premium">N° de Factura</label>
                <input name="nro_factura" className="input-field" placeholder="Ej: 0001-00012345" />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="label-premium">Detalle / Observación</label>
                <textarea name="detalle" className="input-field" style={{ minHeight: "80px", resize: "none" }} placeholder="Descripción del pendiente..." />
              </div>

              {canEditSeguimiento && (
                <div>
                  <label className="label-premium">Seguimiento</label>
                  <select name="seguimiento" className="input-field">
                    {SEGUIMIENTO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {!canEditSeguimiento && (
                <input type="hidden" name="seguimiento" value="Falta Pagos" />
              )}

              <div style={{ gridColumn: canEditSeguimiento ? "1" : "span 2" }}>
                <label className="label-premium">Archivos Adjuntos (Facturas)</label>
                <div
                  style={{ border: "2px dashed var(--glass-border)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", background: "rgba(0,0,0,0.02)", cursor: "pointer" }}
                  onClick={() => document.getElementById('facturacion-file-input')?.click()}
                >
                  <Upload size={24} style={{ color: "var(--primary)", marginBottom: "0.5rem" }} />
                  <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>Click para subir archivos</p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>PDF o Imágenes</p>
                  <input
                    id="facturacion-file-input"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                  />
                </div>
                {files.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    {files.map((f, i) => (
                      <span key={i} style={{ padding: "0.3rem 0.8rem", background: "var(--primary)", color: "white", borderRadius: "20px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {f.name} <X size={14} onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ cursor: "pointer" }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: "1rem", fontSize: "1rem" }}>
                  {loading ? "GUARDANDO..." : "GUARDAR"}
                </button>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ flex: 1, padding: "1rem", borderRadius: "12px", background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", fontWeight: 700 }}>
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div className="glass-panel shadow-premium" style={{ width: "100%", maxWidth: "750px", maxHeight: "92vh", overflow: "auto", padding: "2.5rem", position: "relative", borderRadius: "24px" }}>
            <button onClick={() => setEditingItem(null)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={24} />
            </button>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem", fontWeight: 900 }}>Editar Facturacion</h3>
            <p style={{ margin: "0 0 2rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>{activeOS}</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  try {
                    const res = await updateFacturacionOS(editingItem.id, fd) as any;
                    if (res?.error) {
                      alert("Error: " + res.error);
                    } else {
                      setEditingItem(null);
                      window.location.reload();
                    }
                  } finally {
                    setLoading(false);
                  }
                });
              }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
            >
              <div>
                <label className="label-premium">Fecha</label>
                <input name="fecha" type="date" required className="input-field"
                  defaultValue={editingItem.fecha ? format(new Date(editingItem.fecha), "yyyy-MM-dd") : ""} />
              </div>

              <div>
                <label className="label-premium">N° de Factura</label>
                <input name="nro_factura" className="input-field" defaultValue={editingItem.nro_factura || ""} />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="label-premium">Detalle / Observación</label>
                <textarea name="detalle" className="input-field" style={{ minHeight: "80px", resize: "none" }} defaultValue={editingItem.detalle || ""} />
              </div>

              {canEditSeguimiento && (
                <div>
                  <label className="label-premium">Seguimiento</label>
                  <select name="seguimiento" className="input-field" defaultValue={editingItem.seguimiento}>
                    {SEGUIMIENTO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Existing documents */}
              {Array.isArray(editingItem.documents) && editingItem.documents.length > 0 && (
                <div style={{ gridColumn: "span 2", background: "rgba(14,165,233,0.03)", padding: "1.5rem", borderRadius: "16px", border: "1px dashed var(--primary)" }}>
                  <label className="label-premium" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={16} /> Archivos adjuntos ({editingItem.documents.length})
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    {editingItem.documents.map((d: any) => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 1rem", background: "white", borderRadius: "10px", border: "1px solid rgba(14,165,233,0.2)" }}>
                        <a href={`/api/facturacion-os/doc/${d.id}`} target="_blank" style={{ color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, fontSize: "0.85rem" }}>
                          <FileText size={14} /> {d.filename}
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("¿Eliminar este archivo?")) {
                              const res = await deleteFacturacionOSDocument(d.id);
                              if (res.success) {
                                setEditingItem({ ...editingItem, documents: editingItem.documents.filter((doc: any) => doc.id !== d.id) });
                              }
                            }
                          }}
                          style={{ color: "var(--danger)", cursor: "pointer", background: "none", border: "none", display: "flex" }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ gridColumn: "span 2" }}>
                <label className="label-premium">Agregar Nuevos Archivos</label>
                <input name="documents" type="file" multiple accept="image/*,application/pdf" className="input-field"
                  style={{ padding: "0.75rem", border: "2px dashed rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.01)" }} />
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, padding: "1.25rem", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <Save size={20} /> {loading ? "ACTUALIZANDO..." : "GUARDAR CAMBIOS"}
                </button>
                <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: "1.25rem", borderRadius: "16px", background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", fontWeight: 700 }}>
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table by month */}
      {sortedMonths.length === 0 ? (
        <div className="glass-panel" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          No hay registros para {activeOS}.
        </div>
      ) : (
        sortedMonths.map(month => (
          <div key={month} className="glass-panel" style={{ overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", background: "linear-gradient(90deg, var(--primary) 0%, #0ea5e9 100%)", color: "white" }}>
              <h4 style={{ margin: 0, textTransform: "capitalize", fontWeight: 800 }}>
                {(() => {
                  try { return format(new Date(month + "-02"), "MMMM yyyy", { locale: es }); }
                  catch { return month; }
                })()}
              </h4>
            </div>
            <div className="table-responsive">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--text-muted)", borderBottom: "1px solid var(--glass-border)" }}>
                    <th style={{ padding: "1rem" }}>Fecha</th>
                    <th style={{ padding: "1rem" }}>N° Factura</th>
                    <th style={{ padding: "1rem" }}>Ver Factura</th>
                    <th style={{ padding: "1rem" }}>Detalle / Obs.</th>
                    <th style={{ padding: "1rem" }}>Seguimiento</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {groups[month].map((item: any) => {
                    const dateObj = new Date(item.fecha);
                    const formattedDate = isNaN(dateObj.getTime()) ? "-" : format(dateObj, "dd/MM/yyyy");
                    const docs = Array.isArray(item.documents) ? item.documents : [];

                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                        <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>{formattedDate}</td>
                        <td style={{ padding: "1rem", fontWeight: 700, color: "var(--primary)" }}>{item.nro_factura || "-"}</td>

                        {/* Documents column */}
                        <td style={{ padding: "1rem", position: "relative" }}>
                          {docs.length === 0 ? "-" : docs.length === 1 ? (
                            <a
                              href={`/api/facturacion-os/doc/${docs[0].id}`}
                              target="_blank"
                              className="btn-primary"
                              style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                            >
                              <FileText size={14} /> Ver Factura
                            </a>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenDocDropdown(openDocDropdown === item.id ? null : item.id); }}
                                className="btn-primary"
                                style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                              >
                                <FileText size={14} /> Ver Factura ({docs.length})
                              </button>
                              {openDocDropdown === item.id && (
                                <div style={{ position: "absolute", bottom: "100%", left: 0, zIndex: 100, background: "#ffffff", border: "1px solid var(--glass-border)", borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", minWidth: "220px", padding: "0.75rem", marginBottom: "0.5rem" }}>
                                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Seleccionar archivo:</p>
                                  {docs.map((d: any) => (
                                    <a
                                      key={d.id}
                                      href={`/api/facturacion-os/doc/${d.id}`}
                                      target="_blank"
                                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem", color: "var(--primary)", textDecoration: "none", fontSize: "0.8rem", borderRadius: "6px" }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(14,165,233,0.08)"}
                                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                      <FileText size={14} />
                                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.filename || "Ver Archivo"}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        <td style={{ padding: "1rem", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.detalle}>
                          {item.detalle || "-"}
                        </td>

                        {/* Seguimiento - inline select for admin/gerente */}
                        <td style={{ padding: "1rem" }}>
                          {canEditSeguimiento ? (
                            <select
                              value={item.seguimiento}
                              onChange={(e) => handleQuickSeguimiento(item.id, e.target.value)}
                              style={{
                                ...seguimientoStyle(item.seguimiento),
                                border: "none",
                                cursor: "pointer",
                                outline: "none",
                                appearance: "none",
                                paddingRight: "1.2rem",
                              }}
                            >
                              {SEGUIMIENTO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span style={seguimientoStyle(item.seguimiento)}>{item.seguimiento}</span>
                          )}
                        </td>

                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button onClick={() => setEditingItem(item)} style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(14,165,233,0.1)", color: "var(--primary)", border: "none", cursor: "pointer" }}>
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "none", cursor: "pointer" }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
