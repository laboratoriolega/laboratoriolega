"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createApross, deleteApross, updateApross, deleteAprossDocument } from "@/actions/listados";
import { searchPatients } from "@/actions/patients";
import { format } from "date-fns";
import { es } from 'date-fns/locale/es';
import { Plus, Trash2, Save, X, Search, FileText, Upload, Check, AlertCircle, Pencil, User as UserIcon, Calendar as CalendarIcon, Phone } from "lucide-react";

export default function AprossTable({ data }: { data: any[] }) {
  const [items, setItems] = useState(data);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRow, setShowNewRow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [openDocDropdown, setOpenDocDropdown] = useState<number | null>(null);

  useEffect(() => {
    setItems(data);
    setOpenDocDropdown(null);
  }, [data]);

  // New item form state
  const [newPaciente, setNewPaciente] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [analisisFields, setAnalisisFields] = useState<string[]>([""]);

  const addAnalisisField = () => setAnalisisFields([...analisisFields, ""]);
  const removeAnalisisField = (index: number) => {
    if (analisisFields.length > 1) {
      setAnalisisFields(analisisFields.filter((_, i) => i !== index));
    }
  };
  const updateAnalisisField = (index: number, value: string) => {
    const newFields = [...analisisFields];
    newFields[index] = value;
    setAnalisisFields(newFields);
  };

  const resetForm = () => {
    setNewPaciente("");
    setSelectedPatient(null);
    setFiles([]);
    setAnalisisFields([""]);
    if (formRef.current) formRef.current.reset();
  };

  // Filtering
  const filteredItems = items.filter(it => 
    (it.paciente?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (it.dni || "").includes(searchTerm) ||
    (it.analisis?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Group by month
  const groups = filteredItems.reduce((acc: any, item: any) => {
    if (!item.fecha) return acc;
    const dateObj = new Date(item.fecha);
    if (isNaN(dateObj.getTime())) return acc;
    
    const month = item.month_group || format(dateObj, "yyyy-MM");
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  // Autocomplete logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (newPaciente.length > 1 && !selectedPatient) {
        const res = await searchPatients(newPaciente);
        if (res.data) setSuggestions(res.data);
      } else {
        setSuggestions([]);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [newPaciente, selectedPatient]);

  const handleSelectPatient = (p: any) => {
    setSelectedPatient(p);
    setNewPaciente(p.name);
    setSuggestions([]);
  };

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este registro de Apross?")) return;
    const res = await deleteApross(id);
    if (!res.error) {
      setItems(items.filter(it => it.id !== id));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Buscar por paciente, DNI o análisis..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: "2.8rem" }}
          />
        </div>
        <button onClick={() => { resetForm(); setShowNewRow(true); }} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} /> Agregar Nuevo
        </button>
      </div>

      {/* New Entry Form */}
      {showNewRow && (
        <div className="glass-panel shadow-premium" style={{ padding: "2rem", border: "2px solid var(--primary)", position: "relative" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>Nueva Carga Apross</h3>
          <form 
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              
              startTransition(async () => {
                try {
                  const res = await createApross(fd) as any;
                  if (res && res.error) {
                    alert("Error al guardar: " + res.error);
                  } else {
                    setShowNewRow(false);
                  }
                } catch (err: any) {
                  alert("Error crítico: " + err.message);
                } finally {
                  setLoading(false);
                }
              });
            }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            
            <div style={{ position: "relative" }}>
              <label className="label-premium">Paciente</label>
              <input 
                name="paciente" 
                value={newPaciente}
                onChange={(e) => { setNewPaciente(e.target.value); setSelectedPatient(null); }}
                required 
                className="input-field" 
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div className="glass-panel" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, maxHeight: "200px", overflow: "auto", marginTop: "4px" }}>
                  {suggestions.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectPatient(p)}
                      style={{ padding: "0.75rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--glass-border)" }}
                      className="suggestion-item"
                    >
                      <strong>{p.name}</strong> <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>- DNI: {p.dni}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label-premium">Fecha</label>
              <input name="fecha" type="date" required className="input-field" defaultValue={format(new Date(), "yyyy-MM-dd")} />
            </div>

            <div>
              <label className="label-premium">DNI</label>
              <input 
                name="dni" 
                defaultValue={selectedPatient?.dni || ""} 
                placeholder="Solo números o '-'" 
                className="input-field" 
                onKeyPress={(e) => { if (!/[0-9-]/.test(e.key)) e.preventDefault(); }}
              />
            </div>

            <div>
              <label className="label-premium">Teléfono</label>
              <input 
                name="telefono" 
                defaultValue={selectedPatient?.phone || ""} 
                placeholder="Solo números o '-'" 
                className="input-field" 
                onKeyPress={(e) => { if (!/[0-9-]/.test(e.key)) e.preventDefault(); }}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="label-premium">Análisis</label>
                <button type="button" onClick={addAnalisisField} style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Plus size={16} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {analisisFields.map((field, index) => (
                  <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
                    <input 
                      name="analisis" 
                      value={field}
                      onChange={(e) => updateAnalisisField(index, e.target.value)}
                      required={index === 0} 
                      className="input-field" 
                      placeholder="Ej: Hemograma..." 
                    />
                    {analisisFields.length > 1 && (
                      <button type="button" onClick={() => removeAnalisisField(index)} style={{ color: "var(--danger)", border: "none", background: "none", cursor: "pointer" }}>
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label-premium">Co.Seguro ($)</label>
              <input 
                name="coseguro" 
                type="text" 
                className="input-field" 
                placeholder="Solo números o '-'"
                onKeyPress={(e) => { if (!/[0-9.-]/.test(e.key)) e.preventDefault(); }}
              />
            </div>

            <div>
              <label className="label-premium">Particular EFV ($)</label>
              <input 
                name="particular_efv" 
                type="text" 
                className="input-field" 
                placeholder="Solo números o '-'"
                onKeyPress={(e) => { if (!/[0-9.-]/.test(e.key)) e.preventDefault(); }}
              />
            </div>

            <div>
              <label className="label-premium">Particular TARJ ($)</label>
              <input 
                name="particular_tarjeta" 
                type="text" 
                className="input-field" 
                placeholder="Solo números o '-'"
                onKeyPress={(e) => { if (!/[0-9.-]/.test(e.key)) e.preventDefault(); }}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label className="label-premium">Observación / Detalle</label>
              <textarea name="observaciones" className="input-field" style={{ minHeight: "80px", resize: "none" }} />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label className="label-premium">Pedido Médico (PDF/Imágenes)</label>
              <div style={{ 
                border: "2px dashed var(--glass-border)", padding: "1rem", borderRadius: "12px", textAlign: "center",
                background: "rgba(0,0,0,0.02)", cursor: "pointer"
              }} onClick={() => document.getElementById('file-input')?.click()}>
                <Upload size={24} style={{ color: "var(--primary)", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>Click para subir archivos</p>
                <input 
                  id="file-input"
                  name="documents"
                  type="file" 
                  multiple 
                  accept="image/*,application/pdf" 
                  style={{ display: "none" }} 
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setFiles(prev => [...prev, ...selected]);
                  }}
                />
              </div>
              {files.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ padding: "0.4rem 0.8rem", background: "var(--primary)", color: "white", borderRadius: "20px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {f.name} <X size={14} onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }} style={{ cursor: "pointer" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: "1rem" }}>
                {loading ? "GUARDANDO..." : "GUARDAR CARGA"}
              </button>
              <button type="button" onClick={() => setShowNewRow(false)} style={{ padding: "1rem", borderRadius: "12px", background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", fontWeight: 700 }}>
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables by Month */}
      {sortedMonths.map(month => (
        <div key={month} className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", background: "linear-gradient(90deg, var(--primary) 0%, #0ea5e9 100%)", color: "white" }}>
            <h4 style={{ margin: 0, textTransform: "capitalize", fontWeight: 800 }}>
              {(() => {
                try {
                  const date = new Date(month + "-02");
                  if (isNaN(date.getTime())) return month;
                  return format(date, "MMMM yyyy", { locale: es });
                } catch (e) {
                  return month;
                }
              })()}
            </h4>
          </div>
          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)", borderBottom: "1px solid var(--glass-border)" }}>
                  <th style={{ padding: "1rem" }}>Fecha</th>
                  <th style={{ padding: "1rem" }}>Paciente</th>
                  <th style={{ padding: "1rem" }}>DNI / Tel</th>
                  <th style={{ padding: "1rem" }}>Análisis</th>
                  <th style={{ padding: "1rem" }}>Coseguro</th>
                  <th style={{ padding: "1rem" }}>Part. EFV</th>
                  <th style={{ padding: "1rem" }}>Part. TARJ</th>
                  <th style={{ padding: "1rem" }}>Documentos</th>
                  <th style={{ padding: "1rem" }}>Obs / Detalle</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {groups[month].map((item: any) => {
                  const dateObj = new Date(item.fecha);
                  const formattedDate = isNaN(dateObj.getTime()) ? "Fecha inválida" : format(dateObj, "dd/MM/yyyy");
                  
                  return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>{formattedDate}</td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{item.paciente}</td>
                    <td style={{ padding: "1rem" }}>
                      <div>{item.dni || "-"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.telefono || "-"}</div>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--primary)" }}>{item.analisis}</td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "var(--success)" }}>{item.coseguro ? `$${item.coseguro}` : "-"}</td>
                    <td style={{ padding: "1rem", fontWeight: 700 }}>{item.particular_efv ? `$${item.particular_efv}` : "-"}</td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "#64748b" }}>{item.particular_tarjeta ? `$${item.particular_tarjeta}` : "-"}</td>
                    <td style={{ padding: "1rem", position: "relative" }}>
                      {Array.isArray(item.documents) && item.documents.length > 0 ? (
                        <div>
                          {item.documents.length === 1 ? (
                            <a 
                              href={`/api/apross/doc/${item.documents[0].id}`} 
                              target="_blank" 
                              className="btn-primary" 
                              style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                            >
                              <FileText size={14} /> Ver pedido
                            </a>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenDocDropdown(openDocDropdown === item.id ? null : item.id); }}
                                className="btn-primary" 
                                style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                              >
                                <FileText size={14} /> Ver pedido ({item.documents.length})
                              </button>
                              
                              {openDocDropdown === item.id && (
                                <div style={{ 
                                  position: "absolute", bottom: "100%", right: 0, zIndex: 100, 
                                  background: "#ffffff", border: "1px solid var(--glass-border)", 
                                  borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", 
                                  minWidth: "220px", padding: "0.75rem", marginBottom: "0.5rem",
                                  animation: "fadeIn 0.2s ease"
                                }}>
                                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Seleccionar archivo:</p>
                                  {item.documents.map((d: any) => (
                                    <a 
                                      key={d.id} 
                                      href={`/api/apross/doc/${d.id}`} 
                                      target="_blank" 
                                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem", color: "var(--primary)", textDecoration: "none", fontSize: "0.8rem", borderRadius: "6px", transition: "all 0.2s" }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(14, 165, 233, 0.08)"}
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
                        </div>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "1rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.observaciones}>
                      {item.observaciones || "-"}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingItem(item)} style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(14, 165, 233, 0.1)", color: "var(--primary)", border: "none", cursor: "pointer" }} title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "none", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {/* Editing Modal - Redesigned */}
      {editingItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", animation: "fadeIn 0.3s ease" }}>
          <div className="glass-panel shadow-premium" style={{ 
            width: "100%", maxWidth: "850px", maxHeight: "90vh", overflow: "auto", 
            padding: "2.5rem", position: "relative", borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)"
          }}>
            <button 
              onClick={() => setEditingItem(null)} 
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.025em" }}>Editar Carga Apross</h3>
              <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>Modificá los datos del paciente y sus estudios</p>
            </div>

            <form action={async (fd) => {
              setLoading(true);
              const res = await updateApross(editingItem.id, fd);
              if (!res.error) {
                setEditingItem(null);
                setLoading(false);
              } else {
                alert("Error al actualizar: " + res.error);
                setLoading(false);
              }
            }} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
              
              <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                <div>
                  <label className="label-premium" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserIcon size={14} /> Paciente
                  </label>
                  <input name="paciente" defaultValue={editingItem.paciente} required className="input-field" style={{ fontSize: "1rem", fontWeight: 600 }} />
                </div>

                <div>
                  <label className="label-premium" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CalendarIcon size={14} /> Fecha
                  </label>
                  <input name="fecha" type="date" defaultValue={editingItem.fecha ? format(new Date(editingItem.fecha), "yyyy-MM-dd") : ""} required className="input-field" />
                </div>

                <div>
                  <label className="label-premium">DNI</label>
                  <input name="dni" defaultValue={editingItem.dni} className="input-field" placeholder="41.283.739" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", gridColumn: "span 2" }}>
                <div>
                  <label className="label-premium" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Phone size={14} /> Teléfono
                  </label>
                  <input name="telefono" defaultValue={editingItem.telefono} className="input-field" placeholder="351-000000" />
                </div>
                <div>
                  <label className="label-premium">Análisis</label>
                  <input name="analisis" defaultValue={editingItem.analisis} required className="input-field" style={{ color: "var(--primary)", fontWeight: 700 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", gridColumn: "span 2" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.03)", padding: "1rem", borderRadius: "16px", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                  <label className="label-premium" style={{ color: "var(--success)" }}>Co.Seguro ($)</label>
                  <input name="coseguro" defaultValue={editingItem.coseguro} className="input-field" style={{ background: "white", color: "var(--success)", fontWeight: 800, fontSize: "1.1rem" }} />
                </div>
                <div style={{ background: "rgba(15, 23, 42, 0.03)", padding: "1rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <label className="label-premium">Particular EFV ($)</label>
                  <input name="particular_efv" defaultValue={editingItem.particular_efv} className="input-field" style={{ background: "white", fontWeight: 800, fontSize: "1.1rem" }} />
                </div>
                <div style={{ background: "rgba(100, 116, 139, 0.03)", padding: "1rem", borderRadius: "16px", border: "1px solid rgba(100, 116, 139, 0.1)" }}>
                  <label className="label-premium">Particular TARJ ($)</label>
                  <input name="particular_tarjeta" defaultValue={editingItem.particular_tarjeta} className="input-field" style={{ background: "white", fontWeight: 800, fontSize: "1.1rem", color: "#475569" }} />
                </div>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label className="label-premium">Observación / Detalle</label>
                <textarea name="observaciones" defaultValue={editingItem.observaciones} className="input-field" style={{ minHeight: "100px", resize: "none", fontSize: "0.95rem", padding: "1rem" }} placeholder="Sin observaciones..." />
              </div>

              {/* Existing Documents */}
              {Array.isArray(editingItem.documents) && editingItem.documents.length > 0 && (
                <div style={{ gridColumn: "span 2", background: "rgba(14, 165, 233, 0.03)", padding: "1.5rem", borderRadius: "20px", border: "1px dashed var(--primary)" }}>
                  <label className="label-premium" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={16} /> Archivos Adjuntos ({editingItem.documents.length})
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    {editingItem.documents.map((d: any) => (
                      <div key={d.id} style={{ 
                        display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 1rem", 
                        background: "white", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        border: "1px solid rgba(14, 165, 233, 0.2)"
                      }}>
                        <a 
                          href={`/api/apross/doc/${d.id}`} 
                          target="_blank"
                          style={{ color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, fontSize: "0.85rem" }}
                        >
                          <FileText size={14} /> {d.filename}
                        </a>
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (confirm("¿Eliminar este archivo?")) {
                              const res = await deleteAprossDocument(d.id);
                              if (res.success) {
                                setEditingItem({
                                  ...editingItem,
                                  documents: editingItem.documents.filter((doc: any) => doc.id !== d.id)
                                });
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
                <div style={{ position: "relative" }}>
                   <input 
                    name="documents" 
                    type="file" 
                    multiple 
                    accept="image/*,application/pdf" 
                    className="input-field"
                    style={{ padding: "0.75rem", border: "2px dashed rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.01)" }}
                  />
                </div>
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ 
                  flex: 2, padding: "1.25rem", borderRadius: "16px", fontSize: "1.1rem", 
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  boxShadow: "0 10px 20px -5px rgba(14, 165, 233, 0.4)"
                }}>
                  <Save size={20} />
                  {loading ? "ACTUALIZANDO..." : "GUARDAR CAMBIOS"}
                </button>
                <button type="button" onClick={() => setEditingItem(null)} style={{ 
                  flex: 1, padding: "1.25rem", borderRadius: "16px", background: "rgba(0,0,0,0.05)", 
                  border: "none", cursor: "pointer", fontWeight: 800, color: "var(--text-muted)" 
                }}>
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sortedMonths.length === 0 && !loading && (
        <div className="glass-panel" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
           No hay registros de Apross encontrados.
        </div>
      )}
    </div>
  );
}
