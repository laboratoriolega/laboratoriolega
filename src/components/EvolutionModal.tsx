"use client";

import { useState } from "react";
import { X, CheckCircle, FileText } from "lucide-react";
import { updateEvolution } from "@/actions/appointments";

export default function EvolutionModal({ isOpen, onClose, ap }: { isOpen: boolean, onClose: () => void, ap: any }) {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ap?.status || "AGENDADO");

  if (!isOpen || !ap) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const status = formData.get("status");
    const notes = formData.get("evolution_notes") as string;

    if (status === "CANCELADO" && (!notes || notes.trim().length < 5)) {
      alert("Por favor, ingresá un motivo válido para la cancelación (mínimo 5 caracteres).");
      return;
    }

    setLoading(true);
    formData.append("id", ap.id);
    await updateEvolution(formData);
    setLoading(false);
    onClose();
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyItems: "center", zIndex: 1000,
      padding: "1rem", overflowY: "auto"
    }}>
      <div className="glass-panel" style={{
        background: "var(--glass-bg)", padding: "1.5rem", borderRadius: "20px",
        width: "100%", maxWidth: "500px", margin: "auto", position: "relative",
        border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow)"
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)", padding: "0.5rem" }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={20} color="var(--primary)" /> Evaluar Sesión
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Paciente: <strong style={{color: 'var(--text-main)'}}>{ap.name}</strong> • {ap.analysis_type}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)" }}>Estado de la Consulta</label>
            <select 
              name="status" 
              defaultValue={ap.status} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field" 
              style={{ padding: "0.6rem" }}
            >
              <option value="AGENDADO">Agendado (Pendiente)</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {selectedStatus === "CANCELADO" ? "Motivo de la Cancelación (Obligatorio)" : "Evolución / Accionables futuros"}
            </label>
            <textarea 
              name="evolution_notes" 
              defaultValue={ap.evolution_notes || ""} 
              className="input-field" 
              rows={5}
              placeholder="Escribe el desarrollo de la sesión, notas importantes o los próximos pasos a seguir con este paciente..."
              style={{ resize: "vertical" }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Guardando..." : <><CheckCircle size={18} /> Guardar Evolución</>}
          </button>
        </form>
      </div>
    </div>
  );
}
