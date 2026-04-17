"use client";

import { useState } from "react";
import AppointmentModal from "./AppointmentModal";

export default function NewAppointmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button className="btn-primary" onClick={() => setIsOpen(true)}>
        + Nuevo Turno
      </button>
      <AppointmentModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
