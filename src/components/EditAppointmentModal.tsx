"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, updateAppointment, deleteAppointment } from "@/actions/appointments";
import { X, Calendar, Edit, Loader2, Info, CloudUpload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { compressImage } from "@/lib/compression";
import Portal from "./Portal";

export default function EditAppointmentModal({ isOpen, onClose, ap }: { isOpen: boolean, onClose: () => void, ap: any }) {
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (ap) {
      setAnalysisType(ap.analysis_type || "");
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
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid var(--glass-border)",
    background: "rgba(0,0,0,0.1)",
    fontSize: "0.9rem",
    color: "var(--text-main)",
    outline: "none"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.25rem",
    fontSize: "0.8rem",
    fontWeight: 600,
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
        borderRadius: "16px", boxShadow: "var(--glass-shadow)",
        overflow: "hidden", border: "1px solid var(--glass-border)"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-gradient-end)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "var(--text-main)" }}>
            <Edit size={18} color="var(--primary)" /> Modificar Turno
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Paciente (Informativo)</label>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>{ap.name}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>DNI: {ap.dni}</p>
          </div>

          <div>
            <label style={labelStyle}>Obra Social</label>
            <input required name="health_insurance" defaultValue={ap.health_insurance} type="text" list="insurance-list-edit" className="input-field" style={inputStyle} />
            <datalist id="insurance-list-edit">
                <option value="Particular" />
                <option value="A.A.T.R.A. - OSTYR - (SCIS S.A. )" />
                <option value="A.M.U.R." />
                <option value="A.P.M." />
                <option value="APROSS" />
                <option value="AVALIAN" />
                <option value="CAJA DE ABOGADOS" />
                <option value="CAJA NOTARIAL" />
                <option value="CEA - SAN PEDRO" />
                <option value="CIENCIAS ECONOMICAS" />
                <option value="COBERTURA DE SALUD S.A. (BOREAL)" />
                <option value="D.A.S.P.U." />
                <option value="DA.SU.Te.N" />
                <option value="FEDERADA SALUD" />
                <option value="GRUPO PREMEDIC" />
                <option value="IOSFA" />
                <option value="JERARQUICOS SALUD" />
                <option value="LUIS PASTEUR" />
                <option value="O.P.D.E.A." />
                <option value="O.S.P.E.R.Y.H.R.A." />
                <option value="O.S.P.I.A." />
                <option value="O.S.P.I.G.P.C." />
                <option value="OBRA SOCIAL PERSONAL DE FARMACIA (O.S.P.F.)" />
                <option value="OSADEF" />
                <option value="OSFFENTOS" />
                <option value="OSMISS" />
                <option value="OSPACA" />
                <option value="OSPCRA" />
                <option value="OSPECOR" />
                <option value="OSPEP" />
                <option value="OSPICAL ENSALUD" />
                <option value="OSPIHMP" />
                <option value="OSPIM" />
                <option value="OSPJTAP" />
                <option value="OSPL" />
                <option value="OSSACRA AMA SALUD" />
                <option value="OSTEL" />
                <option value="OSTEP" />
                <option value="PAMI" />
                <option value="PODER JUDICIAL" />
                <option value="PREVENCION SALUD" />
                <option value="S.A.D.A.I.C." />
                <option value="S.A.P." />
                <option value="SANCOR SALUD" />
                <option value="SUPERINTEND.DE BIENESTAR POLICIA FEDERAL ARG." />
                <option value="UNION PERSONAL" />
                <option value="VETERANOS DE GUERRA" />
                <option value="Osde" />
                <option value="Swiss medical" />
                <option value="Medife" />
                <option value="Galeno" />
              </datalist>
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
            <div>
              <label style={labelStyle}>Tipo de Análisis</label>
              <input 
                required 
                name="analysis_type" 
                defaultValue={ap.analysis_type}
                type="text" 
                list="analysis-list-edit" 
                className="input-field" 
                style={inputStyle}
                onChange={(e) => setAnalysisType(e.target.value)}
              />
              <datalist id="analysis-list-edit">
                <option value="Extraccion" />
                <option value="Materia fecal" />
                <option value="Pylori" />
                <option value="Test de aire" />
                <option value="Alcat" />
                <option value="Cibic" />
                <option value="Derivacion" />
                <option value="Panel" />
                <option value="Orina" />
              </datalist>
            </div>
          </div>

          {analysisType === 'Test de aire' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <label style={labelStyle}>Tipo de Aire Espirado</label>
              <select name="aire_test_type" defaultValue={ap.aire_test_type || ""} required className="input-field" style={inputStyle}>
                <option value="">-- Seleccionar --</option>
                <option value="SIBO">SIBO</option>
                <option value="SIBO c/Lactulon">SIBO c/Lactulon</option>
                <option value="Lactosa">Lactosa</option>
                <option value="Fructuosa">Fructuosa</option>
              </select>
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

          {analysisType === 'Test de aire' && (
            <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
               <Info size={16} color="#3b82f6" style={{ marginTop: '2px' }} />
               <p style={{ margin: 0, fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.4 }}>
                 Los turnos de **Test de aire** tienen un cupo máximo de 4 por día. Si cambias la fecha a un día lleno, el sistema no lo permitirá.
               </p>
            </div>
          )}

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
