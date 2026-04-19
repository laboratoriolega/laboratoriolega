"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateAppointment } from "@/actions/appointments";
import { X, Calendar, Edit, Loader2, Info } from "lucide-react";
import { format } from "date-fns";

export default function EditAppointmentModal({ isOpen, onClose, ap }: { isOpen: boolean, onClose: () => void, ap: any }) {
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (ap) {
      setAnalysisType(ap.analysis_type || "");
    }
  }, [ap]);

  if (!isOpen || !ap) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", ap.id);
    
    try {
      const res = await updateAppointment(formData);
      if (res.error) {
        alert(res.error);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      alert("Error al actualizar el turno.");
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
    outline: "none"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.25rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#64748b"
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        background: "white", width: "100%", maxWidth: "500px",
        borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Edit size={18} color="var(--primary)" /> Modificar Turno
          </h3>
          <button onClick={onClose} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
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
                <option value="OSDE" />
                <option value="Swiss Medical" />
                <option value="Galeno" />
                <option value="PAMI" />
                <option value="IOMA" />
                <option value="Medicus" />
                <option value="OMINT" />
              </datalist>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                <option value="Aires" />
                <option value="Rutina" />
                <option value="Hemograma" />
              </datalist>
            </div>
          </div>

          {analysisType === 'Aires' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <label style={labelStyle}>Tipo de Aire Espirado</label>
              <select name="aire_test_type" defaultValue={ap.aire_test_type || ""} required className="input-field" style={inputStyle}>
                <option value="">-- Seleccionar --</option>
                <option value="SIBO">SIBO</option>
                <option value="Lactosa">Lactosa</option>
                <option value="Fructuosa">Fructuosa</option>
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>Observaciones</label>
            <textarea name="observations" defaultValue={ap.observations || ""} className="input-field" style={{...inputStyle, resize: 'vertical'}} rows={3} />
          </div>

          {analysisType === 'Aires' && (
            <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
               <Info size={16} color="#3b82f6" style={{ marginTop: '2px' }} />
               <p style={{ margin: 0, fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.4 }}>
                 Los turnos de **Aires** tienen un cupo máximo de 4 por día. Si cambias la fecha a un día lleno, el sistema no lo permitirá.
               </p>
            </div>
          )}

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", background: "#f1f5f9", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>Cerrar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "0.75rem", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
              {loading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
