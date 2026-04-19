"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/actions/appointments";
import { format } from "date-fns";
import { User, FileText, Calendar, CloudUpload, X, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/compression";
import Portal from "./Portal";

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  defaultDate 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  defaultDate?: Date 
}) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysisType, setAnalysisType] = useState("");
  const router = useRouter();
  
  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // Normalize Date to ISO (Avoid timezone shifts)
      const rawDate = formData.get("appointment_date") as string;
      if (!rawDate) {
        alert("Por favor selecciona una fecha y hora.");
        setLoading(false);
        return;
      }
      formData.set("appointment_date", new Date(rawDate).toISOString());

      // Image Compression Logic
      const file = formData.get("document") as File;
      if (file && file.size > 0 && file.type.startsWith("image/")) {
        console.log("Original size:", (file.size / 1024 / 1024).toFixed(2), "MB");
        const compressedBlob = await compressImage(file);
        formData.set("document", compressedBlob, "processed_image.jpg");
        console.log("Compressed size:", (compressedBlob.size / 1024 / 1024).toFixed(2), "MB");
      }

      await createAppointment(formData);
      onClose();
      router.refresh();
    } catch(err) {
      console.error(err);
      alert("Error al cargar el turno. Verifica que el archivo no sea demasiado grande.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "0.9rem",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s ease"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.25rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#64748b"
  };

  return (
    <Portal>
      <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
      padding: "1rem",
      animation: "fadeIn 0.2s ease-out"
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modern-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
          background: #ffffff !important;
        }
        .modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .modal-body::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        @media (max-width: 640px) {
          .modal-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <div style={{ 
        width: "100%", maxWidth: "550px", 
        maxHeight: "95vh",
        background: "var(--glass-bg)",
        borderRadius: "16px",
        boxShadow: "var(--glass-shadow)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        border: "1px solid var(--glass-border)"
      }}>
        <div style={{ 
          padding: "1rem 1.5rem", 
          borderBottom: "1px solid var(--glass-border)", 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          background: "var(--bg-gradient-end)"
        }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Calendar size={20} color="var(--primary)" />
            {defaultDate ? `Agendar: ${format(defaultDate, 'dd/MM')}` : "Agendar Nuevo Turno"}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(255,255,255,0.6)", color: "#64748b",
              transition: "all 0.2s ease", border: "none", cursor: "pointer"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.color = "#64748b" }}
          >
            <X size={16} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} encType="multipart/form-data" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
          
          <div>
            <label style={labelStyle}>Nombre del Paciente</label>
            <div style={{ position: "relative" }}>
              <User size={16} color="#94a3b8" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }} />
              <input required name="name" type="text" className="modern-input" style={{...inputStyle, paddingLeft: "2.5rem"}} placeholder="Ej: Walter Gómez" />
            </div>
          </div>

          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>DNI</label>
              <input required name="dni" type="text" className="modern-input" style={inputStyle} placeholder="12345678" />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input required name="phone" type="tel" className="modern-input" style={inputStyle} placeholder="Ej: 11 1234-5678" />
            </div>
          </div>

          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Obra Social</label>
              <input required name="health_insurance" type="text" list="insurance-list" className="modern-input" style={inputStyle} placeholder="Ej: OSDE, PAMI, etc." />
              <datalist id="insurance-list">
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
            <div>
              <label style={labelStyle}>Tipo de Análisis</label>
              <input 
                required 
                name="analysis_type" 
                type="text" 
                list="analysis-list" 
                className="modern-input" 
                style={inputStyle} 
                placeholder="Ej: Test de aire, Rutina, etc."
                onChange={(e) => setAnalysisType(e.target.value)}
              />
              <datalist id="analysis-list">
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
              <select name="aire_test_type" required className="modern-input" style={inputStyle}>
                <option value="">-- Seleccionar Prueba --</option>
                <option value="SIBO">SIBO</option>
                <option value="Lactosa">Lactosa</option>
                <option value="Fructuosa">Fructuosa</option>
              </select>
            </div>
          )}

          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Fecha y Hora</label>
              <input 
                required 
                name="appointment_date" 
                type="datetime-local" 
                defaultValue={defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : undefined}
                className="modern-input"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observaciones Adicionales</label>
            <input name="observations" type="text" className="modern-input" style={inputStyle} placeholder="Contexto adicional del turno..." />
          </div>

          <div>
            <label style={{...labelStyle, marginBottom: "0.25rem" }}>Documentación Médica</label>
            <div style={{ 
              position: "relative",
              border: "2px dashed #cbd5e1", 
              borderRadius: "10px", 
              background: "#f8fafc",
              padding: "1rem",
              textAlign: "center",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}
            >
              <CloudUpload size={22} color="var(--primary)" style={{ margin: "0 auto 0.25rem auto" }} />
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", margin: 0 }}>
                {fileName ? "Archivo seleccionado:" : "Adjuntar Pedido Médico (Imagen/PDF)"}
              </p>
              <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, marginTop: "0.25rem" }}>
                {fileName ? fileName : "Haz clic o arrastra"}
              </p>
              <input 
                name="document" 
                type="file" 
                accept="image/*,.pdf" 
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                style={{ 
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
                  opacity: 0, cursor: "pointer" 
                }} 
              />
            </div>
          </div>

          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", flexShrink: 0 }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                flex: 1, padding: "0.75rem", 
                background: "#f1f5f9", color: "#475569", 
                borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem",
                transition: "all 0.2s ease", border: "none", cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                flex: 1, padding: "0.75rem", 
                background: "linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)", 
                color: "white", 
                borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem",
                transition: "all 0.2s ease", border: "none", cursor: loading ? "wait" : "pointer",
                boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.3)",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if(!loading) e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 10px -1px rgba(14, 165, 233, 0.4)" }}
              onMouseLeave={(e) => { if(!loading) e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(14, 165, 233, 0.3)" }}
            >
              {loading ? "Agendando..." : "Agendar Turno Seguro"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
