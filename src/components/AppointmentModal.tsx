"use client";

import { useState } from "react";
import { createAppointment } from "@/actions/appointments";
import { format } from "date-fns";
import { User, FileText, Calendar, CloudUpload, X } from "lucide-react";

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
  
  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createAppointment(formData);
      onClose();
      window.location.reload(); 
    } catch(err) {
      console.error(err);
      alert("Error al cargar el turno");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "0.95rem",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s ease"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.4rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b"
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
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
      `}</style>
      
      <div style={{ 
        width: "100%", maxWidth: "550px", 
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <div style={{ 
          padding: "1.5rem 2rem", 
          borderBottom: "1px solid #f1f5f9", 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(to right, #fbfcdb 0%, #e6f2f5 100%)" // Premium soft gradient
        }}>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={22} color="var(--primary)" />
            {defaultDate ? `Agendar Turno: ${format(defaultDate, 'dd/MM')}` : "Agendar Nuevo Turno"}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", borderRadius: "50%",
              background: "rgba(255,255,255,0.6)", color: "#64748b",
              transition: "all 0.2s ease", border: "none", cursor: "pointer"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.color = "#64748b" }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div>
            <label style={labelStyle}>Nombre del Paciente</label>
            <div style={{ position: "relative" }}>
              <User size={18} color="#94a3b8" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
              <input required name="name" type="text" className="modern-input" style={{...inputStyle, paddingLeft: "2.75rem"}} placeholder="Ej: Walter Gómez" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>DNI</label>
              <input required name="dni" type="text" className="modern-input" style={inputStyle} placeholder="12345678" />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input required name="phone" type="tel" className="modern-input" style={inputStyle} placeholder="Ej: 11 1234-5678" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Obra Social</label>
              <input required name="health_insurance" type="text" className="modern-input" style={inputStyle} placeholder="Ej: OSDE, Particular" />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Análisis</label>
              <input required name="analysis_type" type="text" className="modern-input" style={inputStyle} placeholder="Ej: SIBO, Esputo, etc." />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
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

          <div style={{ marginTop: "0.5rem" }}>
            <label style={{...labelStyle, marginBottom: "0.5rem" }}>Documentación Medica</label>
            <div style={{ 
              position: "relative",
              border: "2px dashed #cbd5e1", 
              borderRadius: "12px", 
              background: "#f8fafc",
              padding: "1.5rem",
              textAlign: "center",
              transition: "all 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}
            >
              <CloudUpload size={28} color="var(--primary)" style={{ margin: "0 auto 0.5rem auto" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                {fileName ? "Archivo seleccionado:" : "Adjuntar Pedido Médico (Imagen/PDF)"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {fileName ? fileName : "Arrastra el archivo o haz clic para subir"}
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

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                flex: 1, padding: "0.875rem", 
                background: "#f1f5f9", color: "#475569", 
                borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem",
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
                flex: 1, padding: "0.875rem", 
                background: "linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)", 
                color: "white", 
                borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem",
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
  );
}
