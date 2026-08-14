"use client";

/**
 * PatientInsuranceSelector
 * Shows chips of previously-used health insurances for a given patient.
 * Clicking a chip sets it as the selected value in the HealthInsuranceInput below it.
 */
import { useEffect, useState } from "react";
import { getPatientHealthInsurances } from "@/actions/ingresos";

interface Props {
  patientId: string | null | undefined;
  selectedInsurance: string;
  onSelect: (insurance: string) => void;
}

export default function PatientInsuranceSelector({ patientId, selectedInsurance, onSelect }: Props) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory([]);
    if (!patientId) return;
    getPatientHealthInsurances(patientId).then(res => {
      if (res.data && res.data.length > 0) setHistory(res.data);
    });
  }, [patientId]);

  if (!patientId || history.length === 0) return null;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Obras sociales anteriores del paciente:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {history.map(ins => {
          const isActive = selectedInsurance === ins;
          return (
            <button
              key={ins}
              type="button"
              onClick={() => onSelect(ins)}
              title={`Usar ${ins} para este ingreso`}
              style={{
                padding: '0.25rem 0.7rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                background: isActive ? 'rgba(14, 165, 233, 0.18)' : 'rgba(255,255,255,0.04)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {ins}
            </button>
          );
        })}
      </div>
    </div>
  );
}
