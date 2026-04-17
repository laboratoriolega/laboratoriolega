"use client";

import { useState } from "react";
import { createAppointment } from "@/actions/appointments";
import { format } from "date-fns";

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

  return (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", background: "var(--bg-gradient-start)" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                {defaultDate ? `Agendar Turno para ${format(defaultDate, 'dd/MM')}` : "Agendar Nuevo Turno"}
              </h3>
              <button type="button" onClick={onClose} style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Nombre del Paciente</label>
                <input required name="name" type="text" className="input-field" placeholder="Ej: Walter Gómez" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>DNI</label>
                  <input required name="dni" type="text" className="input-field" placeholder="12345678" />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Obra Social</label>
                  <input required name="health_insurance" type="text" className="input-field" placeholder="Ej: OSDE, Swiss, Particular" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Fecha y Hora</label>
                  <input 
                    required 
                    name="appointment_date" 
                    type="datetime-local" 
                    defaultValue={defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : undefined}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Tipo de Análisis</label>
                  <input required name="analysis_type" type="text" className="input-field" placeholder="Ej: SIBO, Lactosa" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Observaciones</label>
                <input name="observations" type="text" className="input-field" placeholder="Ej: Llega 10 mins tarde..." />
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--primary)', borderRadius: '8px' }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Adjuntar Pedido Médico (Imagen/PDF)</label>
                <input name="document" type="file" accept="image/*,.pdf" style={{ width: '100%', fontSize: '0.875rem' }} />
              </div>
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" onClick={onClose} style={{ color: "var(--text-muted)", padding: "0.75rem 1rem" }}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Guardando..." : "Confirmar Turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
