"use client";

import { useState } from "react";
import { createAppointment } from "@/actions/appointments";

export default function NewAppointmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      dni: formData.get("dni") as string,
      email: formData.get("email") as string,
      health_insurance: formData.get("health_insurance") as string,
      appointment_date: formData.get("appointment_date") as string,
      analysis_type: formData.get("analysis_type") as string,
      observations: formData.get("observations") as string,
    };
    
    try {
      await createAppointment(data);
      setIsOpen(false);
      window.location.reload(); // Quick refresh for MVP
    } catch(err) {
      console.error(err);
      alert("Error al cargar el turno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setIsOpen(true)}>
        + Nuevo Turno
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", background: "var(--bg-gradient-start)" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Agendar Nuevo Turno</h3>
              <button onClick={() => setIsOpen(false)} style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  <input required name="appointment_date" type="datetime-local" className="input-field" />
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
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" onClick={() => setIsOpen(false)} style={{ color: "var(--text-muted)", padding: "0.75rem 1rem" }}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Guardando..." : "Confirmar Turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
