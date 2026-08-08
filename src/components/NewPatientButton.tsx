"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import NewPatientModal from "./NewPatientModal";

export default function NewPatientButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Crear nuevo paciente"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 1rem',
          background: 'var(--primary)',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.85rem',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(14, 165, 233, 0.3)',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(14, 165, 233, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(14, 165, 233, 0.3)';
        }}
      >
        <Plus size={16} />
        Nuevo Paciente
      </button>

      <NewPatientModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
