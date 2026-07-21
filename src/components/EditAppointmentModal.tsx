"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, updateAppointment, deleteAppointment } from "@/actions/appointments";
import { X, Calendar, Edit, Loader2, Info, CloudUpload, Trash2, Plus } from "lucide-react";
import HealthInsuranceInput from "./HealthInsuranceInput";
import TipoAnalisisInput from "./TipoAnalisisInput";
import { format } from "date-fns";
import { compressImage } from "@/lib/compression";
import Portal from "./Portal";

export default function EditAppointmentModal({ isOpen, onClose, ap, isAires }: { isOpen: boolean, onClose: () => void, ap: any, isAires?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState("");
  const [analyses, setAnalyses] = useState<{ analysis_name: string, aire_test_subtype?: string, is_aire?: boolean }[]>([{ analysis_name: '', aire_test_subtype: '', is_aire: true }]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (ap) {
      setAnalysisType(ap.analysis_type || "");
      const airTestNames = ['SIBO', 'LACTOSA', 'FRUCTUOSA', 'SIBO C/LACTULON', 'AIRES', 'TEST DE AIRE'];
      if (ap.analyses && ap.analyses.length > 0) {
        setAnalyses(ap.analyses.map((a: any) => ({ 
            analysis_name: a.name || '', 
            aire_test_subtype: a.subtype || '',
            is_aire: airTestNames.includes((a.name || '').toUpperCase()) || airTestNames.includes((a.subtype || '').toUpperCase())
        })));
      } else {
        setAnalyses([{ 
            analysis_name: ap.analysis_type || '', 
            aire_test_subtype: ap.aire_test_type || '',
            is_aire: true 
        }]);
      }
      setSelectedFiles([]); // Reset new files when opening a different appointment
    }
  }, [ap]);

  if (!isOpen || !ap) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", ap.id);

    // Normalize Date to ISO with Offset
    const rawDate = formData.get("appointment_date") as string;
    if (rawDate) {
      const formattedDate = format(new Date(rawDate), "yyyy-MM-dd'T'HH:mm:ssxxx");
      formData.set("appointment_date", formattedDate);
    }

    // Clean default "document" entry
    formData.delete("document");

    // Process and Append all NEW selected files
    try {
      for (const file of selectedFiles) {
        if (file.type.startsWith("image/")) {
          const compressedBlob = await compressImage(file);
          formData.append("document", compressedBlob, file.name);
        } else {
          formData.append("document", file);
        }
      }

      const res = await updateAppointment(formData);
      if (res?.error) {
        alert(res.error);
      } else {
        setSelectedFiles([]);
        onClose();
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar el turno.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDoc(docId: number) {
    if (!confirm("¿Borrar este archivo?")) return;
    try {
      const res = await deleteDocument(docId);
      if (res.success) {
        // We could also filter it out locally if we had a local docs state, 
        // but router.refresh() + getAppointments again will work.
        router.refresh();
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert("Error eliminando archivo");
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de que deseas eliminar el turno de ${ap.name}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      const res = await deleteAppointment(ap.id);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        alert(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar el turno.");
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid var(--glass-border)",
    background: "rgba(0,0,0,0.1)",
    fontSize: "0.85rem",
    color: "var(--text-main)",
    outline: "none"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.15rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--text-muted)"
  };

  return (
    <Portal>
      <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
      padding: "1rem"
    }}>
      <style>{`
        @media (max-width: 640px) {
          .modal-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="glass-panel" style={{
        background: "var(--glass-bg)", width: "100%", maxWidth: "500px",
        maxHeight: "90vh",
        borderRadius: "16px", boxShadow: "var(--glass-shadow)",
        overflow: "hidden", border: "1px solid var(--glass-border)",
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-gradient-end)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "var(--text-main)" }}>
            <Edit size={18} color="var(--primary)" /> Modificar Turno
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.8rem", overflowY: "auto" }}>
          <div>
            <label style={labelStyle}>Paciente (Informativo)</label>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>{ap.name}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>DNI: {ap.dni}</p>
          </div>
          <div>
            <label style={labelStyle}>Obra Social</label>
            <HealthInsuranceInput defaultValue={ap.health_insurance} listId="insurance-list-editapt" className="input-field" style={inputStyle} />
          </div>

          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Fecha y Hora</label>
              <input 
                required 
                name="appointment_date" 
                type="datetime-local" 
                defaultValue={ap.appointment_date ? format(new Date(ap.appointment_date), "yyyy-MM-dd'T'HH:mm") : ""}
                className="input-field"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Multi-Analysis Selection */}
          <div style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Estudios / Análisis</label>
              {!isAires && (
                <button 
                  type="button" 
                  onClick={() => setAnalyses([...analyses, { analysis_name: '', aire_test_subtype: '' }])}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} /> AGREGAR
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(() => {
                // If in Aires mode, separate visible and hidden analyses based on the initial flag
                const visibleAnalyses = isAires 
                  ? analyses.filter(a => a.is_aire !== false)
                  : analyses;
                
                const hiddenAnalyses = isAires
                  ? analyses.filter(a => a.is_aire === false)
                  : [];

                return (
                  <>
                    {/* Hidden inputs to preserve other studies when in Aires mode */}
                    {hiddenAnalyses.map((a, idx) => (
                      <div key={`hidden-${idx}`}>
                        <input type="hidden" name="analysis_name" value={a.analysis_name} />
                        <input type="hidden" name="aire_test_subtype" value={a.aire_test_subtype || ''} />
                      </div>
                    ))}

                    {visibleAnalyses.map((ana, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
                        <div style={{ flex: 1 }}>
                          <TipoAnalisisInput
                            name="analysis_name"
                            defaultValue={ana.analysis_name}
                            onChange={(e) => {
                              const newAnalyses = [...analyses];
                              const realIndex = analyses.indexOf(ana);
                              newAnalyses[realIndex].analysis_name = e.target.value;
                              setAnalyses(newAnalyses);
                            }}
                            placeholder="Ej: SIBO, Rutina..."
                            className="input-field"
                            style={inputStyle}
                            required
                          />
                        </div>
                        {(!isAires || visibleAnalyses.length > 1) && (
                          <button 
                            type="button" 
                            onClick={() => setAnalyses(analyses.filter(item => item !== ana))}
                            style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
            <input type="hidden" name="analyses_count" value={analyses.length} />
          </div>

          {ap.is_domicilio && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <label style={labelStyle}>Dirección Domicilio</label>
              <input 
                name="domicilio_address" 
                type="text" 
                defaultValue={ap.domicilio_address || ""}
                placeholder="Calle, Número, Localidad..."
                className="input-field" 
                style={inputStyle}
                required
              />
              <input type="hidden" name="is_domicilio" value="true" />
            </div>
          )}

          <div>
            <label style={labelStyle}>Observaciones</label>
            <textarea name="observations" defaultValue={ap.observations || ""} className="input-field" style={{...inputStyle, resize: 'vertical'}} rows={3} />
          </div>

          <div>
            <label style={labelStyle}>Documentación Médica</label>
            
            {/* Current Documents */}
            {ap.documents && ap.documents.length > 0 && (
              <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>Archivos actuales:</p>
                {ap.documents.map((doc: any) => (
                  <div key={doc.id} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.05)", borderRadius: "8px",
                    border: "1px solid var(--glass-border)"
                  }}>
                     <a href={`/api/doc/file/${doc.id}`} target="_blank" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.filename || "Ver archivo"}
                    </a>
                    <button type="button" onClick={() => handleDeleteDoc(doc.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Files */}
            <div style={{ 
              position: "relative",
              border: "2px dashed var(--primary)", 
              borderRadius: "12px", 
              background: "rgba(14, 165, 233, 0.05)",
              padding: "1.5rem 1rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(14, 165, 233, 0.05)"}
            >
              <CloudUpload size={24} color="var(--primary)" style={{ margin: "0 auto 0.4rem auto" }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                {selectedFiles.length > 0 ? `${selectedFiles.length} nuevos seleccionados` : "Agregar más documentos"}
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.2rem 0 0 0" }}>
                Hacé clic aquí para elegir uno o varios (PDF/Imagen)
              </p>
              <input 
                name="document" 
                type="file" 
                multiple
                accept="image/*,.pdf" 
                onChange={handleFileChange}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
              />
            </div>

            {/* List of NEW files */}
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    padding: "0.4rem 0.6rem", background: "var(--glass-bg)", borderRadius: "6px",
                    border: "1px solid var(--glass-border)", fontSize: "0.75rem"
                  }}>
                    <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <button type="button" onClick={() => removeSelectedFile(i)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={loading}
              style={{ 
                padding: "0.75rem", background: "none", color: "var(--danger)", 
                borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)", 
                cursor: loading ? "wait" : "pointer", fontWeight: 600, fontSize: "0.9rem",
                display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)" }}
              onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = "none" }}
            >
              <Trash2 size={18} /> Borrar Turno
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onClose} style={{ padding: "0.75rem 1.5rem", background: "#f1f5f9", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, color: "#475569" }}>Cerrar</button>
            <button type="submit" disabled={loading} style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
              {loading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
