"use client";

import { useState } from "react";
import { X, CalendarDays, CheckCircle } from "lucide-react";
import { moveAppointment } from "@/actions/appointments";
import Portal from "./Portal";

export default function MoveReasonModal({ 
  isOpen, 
  onClose, 
  apptId, 
  newDate,
  onConfirm,
  title,
  confirmLabel,
  placeholder,
  patientName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  apptId?: string | null, 
  newDate?: string | null,
  onConfirm?: (reason: string) => void,
  title?: string,
  confirmLabel?: string,
  placeholder?: string,
  patientName?: string
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  // If not using onConfirm, apptId and newDate are required for the default moveAppointment logic
  if (!onConfirm && (!apptId || !newDate)) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reason = formData.get("reason") as string;

    if (!reason || reason.trim().length < 5) {
      alert("Por favor, ingresá un motivo válido (mínimo 5 caracteres).");
      return;
    }

    if (onConfirm) {
      onConfirm(reason);
      return;
    }

    setLoading(true);
    const res = await moveAppointment(apptId as string, newDate as string, reason);
    setLoading(false);
    
    if (res?.error) {
      alert("Error al mover el turno: " + res.error);
    } else {
      onClose();
    }
  }

  return (
    <Portal>
      <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyItems: "center", zIndex: 2000,
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        background: "var(--glass-bg)", padding: "1.5rem", borderRadius: "20px",
        width: "100%", maxWidth: "400px", margin: "auto", position: "relative",
        border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow)"
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)", padding: "0.5rem" }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarDays size={20} color="var(--primary)" /> {title || "Mover Turno"}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          {onConfirm ? `Confirmar acción para el paciente ${patientName || ''}.` : "¿Por qué estás cambiando la fecha de este turno? Este motivo quedará registrado."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <textarea 
              name="reason" 
              required
              className="input-field" 
              rows={3}
              placeholder={placeholder || "Indica el motivo..."}
              style={{ resize: "none" }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", background: "#f1f5f9", borderRadius: "8px", fontWeight: 600 }}>Cancelar</button>
             <button 
                type="submit" 
                disabled={loading}
                className="btn-primary" 
                style={{ flex: 1, padding: "0.75rem", opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
               >
                {loading ? "Procesando..." : <><CheckCircle size={18} /> {confirmLabel || "Confirmar"}</>}
             </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
