"use client";

import { useState } from "react";
import { X, CalendarDays, CheckCircle } from "lucide-react";
import { moveAppointment } from "@/actions/appointments";

export default function MoveReasonModal({ 
  isOpen, 
  onClose, 
  apptId, 
  newDate 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  apptId: string | null, 
  newDate: string | null 
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !apptId || !newDate) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reason = formData.get("reason") as string;

    if (!reason || reason.trim().length < 5) {
      alert("Por favor, ingresá un motivo válido para el cambio (mínimo 5 caracteres).");
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
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyItems: "center", zIndex: 2000,
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        background: "white", padding: "1.5rem", borderRadius: "20px",
        width: "100%", maxWidth: "400px", margin: "auto", position: "relative"
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)", padding: "0.5rem" }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarDays size={20} color="var(--primary)" /> Mover Turno
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          ¿Por qué estás cambiando la fecha de este turno? Este motivo quedará registrado.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <textarea 
              name="reason" 
              required
              className="input-field" 
              rows={3}
              placeholder="Indica el motivo del cambio de fecha..."
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
                {loading ? "Moviendo..." : <><CheckCircle size={18} /> Confirmar</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
