"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createAppointment, getBlockedDays } from "@/actions/appointments";
import { searchPatients } from "@/actions/patients";
import { format } from "date-fns";
import { User, FileText, Calendar, CloudUpload, X, Loader2, Search } from "lucide-react";
import HealthInsuranceInput from "./HealthInsuranceInput";
import TipoAnalisisInput from "./TipoAnalisisInput";
import { compressImage } from "@/lib/compression";
import Portal from "./Portal";
import PatientInsuranceSelector from "./PatientInsuranceSelector";

type PatientSuggestion = { id: string; name: string; dni: string; phone: string; health_insurance: string };

export default function AppointmentModal({
  isOpen,
  onClose,
  defaultDate,
  initialData,
  isDomicilio,
  isAire
}: {
  isOpen: boolean,
  onClose: () => void,
  defaultDate?: Date,
  initialData?: {
    name?: string,
    dni?: string,
    phone?: string,
    health_insurance?: string,
    analysis_type?: string,
    aire_test_type?: string,
    is_domicilio?: boolean,
    domicilio_address?: string
  },
  isDomicilio?: boolean,
  isAire?: boolean,
  slotId?: string
}) {
  const [loading, setLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analysisType, setAnalysisType] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Autocomplete state
  const [nameValue, setNameValue] = useState(initialData?.name || "");
  const [dniValue, setDniValue] = useState(initialData?.dni || "");
  const [phoneValue, setPhoneValue] = useState(initialData?.phone || "");
  const [insuranceValue, setInsuranceValue] = useState(initialData?.health_insurance || "");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearch, setActiveSearch] = useState<"name" | "dni" | null>(null);
  const [searching, setSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blocked days
  const [blockedDays, setBlockedDays] = useState<{ fecha: string; descripcion: string | null }[]>([]);
  const [blockedError, setBlockedError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setSelectedDocs([]);
      setAnalysisType("");
      setBlockedError(null);
      getBlockedDays().then(res => { if (res.data) setBlockedDays(res.data); });
      setNameValue(initialData?.name || "");
      setDniValue(initialData?.dni || "");
      setPhoneValue(initialData?.phone || "");
      setInsuranceValue(initialData?.health_insurance || "");
      setSelectedPatientId(null);
      setSuggestions([]);
      setShowSuggestions(false);
      if (formRef.current) formRef.current.reset();
    }
  }, [isOpen, isAire, initialData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerSearch = useCallback((query: string, field: "name" | "dni") => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchPatients(query);
      if (res.data && res.data.length > 0) {
        setSuggestions(res.data as PatientSuggestion[]);
        setShowSuggestions(true);
        setActiveSearch(field);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSearching(false);
    }, 250);
  }, []);

  function checkBlockedDate(dateStr: string): { fecha: string; descripcion: string | null } | null {
    if (!dateStr) return null;
    const key = dateStr.slice(0, 10);
    return blockedDays.find(b => b.fecha.slice(0, 10) === key) || null;
  }

  function selectPatient(p: PatientSuggestion) {
    setNameValue(p.name);
    setDniValue(p.dni);
    setPhoneValue(p.phone || "");
    setInsuranceValue(p.health_insurance || "");
    setSelectedPatientId(p.id);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const rawDate = formData.get("appointment_date") as string;
      if (!rawDate) {
        alert("Por favor selecciona una fecha y hora.");
        setLoading(false);
        return;
      }
      const blocked = checkBlockedDate(rawDate);
      if (blocked) {
        const msg = blocked.descripcion
          ? `Esta fecha no está disponible: ${blocked.descripcion}`
          : "Esta fecha está marcada como sin atención. Por favor elegí otro día.";
        setBlockedError(msg);
        setLoading(false);
        return;
      }
      setBlockedError(null);
      const formattedDate = format(new Date(rawDate), "yyyy-MM-dd'T'HH:mm:ssxxx");
      formData.set("appointment_date", formattedDate);
      formData.delete("document");

      const filesToProcess = selectedDocs.length > 0 ? selectedDocs : selectedFiles;

      for (const file of filesToProcess) {
        if (file.type.startsWith("image/")) {
          const compressedBlob = await compressImage(file);
          formData.append("document", compressedBlob, file.name);
        } else {
          formData.append("document", file);
        }
      }

      const res = await createAppointment(formData);
      if (res && res.error) {
        throw new Error(res.error);
      }
      onClose();
      router.refresh();
    } catch(err: any) {
      console.error(err);
      alert(err.message || "Error al cargar el turno.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        setSelectedDocs(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.7rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "0.85rem",
    color: "#1e293b",
    outline: "none",
    transition: "all 0.2s ease"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.15rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748b"
  };

  return (
    <Portal>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "1rem", animation: "fadeIn 0.2s ease-out"
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .modern-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15); background: #ffffff !important; }
          .modal-body::-webkit-scrollbar { width: 6px; }
          .modal-body::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
          @media (max-width: 640px) { .modal-grid-2 { grid-template-columns: 1fr !important; } }
          .patient-suggestion:hover { background: rgba(14,165,233,0.08) !important; }
        `}</style>

        <div style={{
          width: "100%", maxWidth: "520px", maxHeight: "90vh",
          background: "var(--glass-bg)", borderRadius: "16px",
          boxShadow: "var(--glass-shadow)", display: "flex", flexDirection: "column",
          overflow: "hidden", animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          border: "1px solid var(--glass-border)"
        }}>
          <div style={{
            padding: "1rem 1.5rem", borderBottom: "1px solid var(--glass-border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0, background: "var(--bg-gradient-end)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <Calendar size={20} color="var(--primary)" />
              {defaultDate ? `Agendar: ${format(defaultDate, 'dd/MM')}` : "Agendar Nuevo Turno"}
            </h3>
            <button type="button" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", color: "#64748b", transition: "all 0.2s ease", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.color = "#64748b"; }}
            ><X size={16} /></button>
          </div>

          <form ref={formRef} className="modal-body" onSubmit={handleSubmit} encType="multipart/form-data" style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
            <input type="hidden" name="is_domicilio" value={isDomicilio ? "true" : "false"} />

            {/* Name field with autocomplete */}
            <div>
              <label style={labelStyle}>Nombre del Paciente</label>
              <div style={{ position: "relative" }} ref={activeSearch === "name" ? suggestionsRef : undefined}>
                <User size={16} color="#94a3b8" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
                {searching && activeSearch === "name" && (
                  <Loader2 size={14} color="#94a3b8" style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite" }} />
                )}
                <input
                  required
                  name="name"
                  type="text"
                  className="modern-input"
                  style={{ ...inputStyle, paddingLeft: "2.5rem" }}
                  placeholder="Ej: Walter Gómez"
                  value={nameValue}
                  onChange={(e) => {
                    setNameValue(e.target.value);
                    triggerSearch(e.target.value, "name");
                  }}
                  onFocus={() => { if (suggestions.length > 0) { setShowSuggestions(true); setActiveSearch("name"); } }}
                  autoComplete="off"
                />
                {showSuggestions && activeSearch === "name" && suggestions.length > 0 && (
                  <SuggestionsDropdown suggestions={suggestions} onSelect={selectPatient} />
                )}
              </div>
            </div>

            <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* DNI field with autocomplete */}
              <div>
                <label style={labelStyle}>DNI</label>
                <div style={{ position: "relative" }} ref={activeSearch === "dni" ? suggestionsRef : undefined}>
                  {searching && activeSearch === "dni" && (
                    <Loader2 size={14} color="#94a3b8" style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite" }} />
                  )}
                  <input
                    required
                    name="dni"
                    type="text"
                    className="modern-input"
                    style={inputStyle}
                    placeholder="12345678"
                    value={dniValue}
                    onChange={(e) => {
                      setDniValue(e.target.value);
                      triggerSearch(e.target.value, "dni");
                    }}
                    onFocus={() => { if (suggestions.length > 0) { setShowSuggestions(true); setActiveSearch("dni"); } }}
                    autoComplete="off"
                  />
                  {showSuggestions && activeSearch === "dni" && suggestions.length > 0 && (
                    <SuggestionsDropdown suggestions={suggestions} onSelect={selectPatient} />
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  required
                  name="phone"
                  type="tel"
                  className="modern-input"
                  style={inputStyle}
                  placeholder="Ej: 11 1234-5678"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Obra Social</label>
                <PatientInsuranceSelector
                  patientId={selectedPatientId}
                  selectedInsurance={insuranceValue}
                  onSelect={(ins) => setInsuranceValue(ins)}
                />
                <HealthInsuranceInput
                  key={insuranceValue}
                  defaultValue={insuranceValue}
                  listId="insurance-list-apt"
                  className="modern-input"
                  style={inputStyle}
                  placeholder="Ej: Particular, OSDE, etc."
                />
              </div>
              <div>
                <label style={labelStyle}>Tipo de Análisis</label>
                <TipoAnalisisInput
                  name="analysis_type"
                  defaultValue={initialData?.analysis_type || ""}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  className="modern-input"
                  style={inputStyle}
                  placeholder="Ej: SIBO, Rutina, etc."
                  required
                />
              </div>
            </div>


            <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Fecha y Hora</label>
                <input
                  required
                  name="appointment_date"
                  type="datetime-local"
                  defaultValue={defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : undefined}
                  className="modern-input"
                  style={{
                    ...inputStyle,
                    borderColor: blockedError ? '#EF4444' : undefined,
                  }}
                  onChange={(e) => {
                    const b = checkBlockedDate(e.target.value);
                    setBlockedError(b
                      ? (b.descripcion
                          ? `Esta fecha no está disponible: ${b.descripcion}`
                          : "Esta fecha está marcada como sin atención. Por favor elegí otro día.")
                      : null);
                  }}
                />
                {blockedError && (
                  <div style={{ marginTop: '0.4rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>🚫</span> {blockedError}
                  </div>
                )}
              </div>
            </div>

            {isDomicilio && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <label style={labelStyle}>Dirección Domicilio</label>
                <input
                  name="domicilio_address"
                  type="text"
                  defaultValue={initialData?.domicilio_address || ""}
                  placeholder="Calle, Número, Localidad..."
                  className="input-field"
                  style={inputStyle}
                  required
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Observaciones Adicionales</label>
              <input name="observations" type="text" className="modern-input" style={inputStyle} placeholder="Contexto adicional del turno..." />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: "0.25rem" }}>Documentación Médica (Podés seleccionar varios)</label>
              <div style={{
                position: "relative", border: "2px dashed var(--primary)", borderRadius: "12px",
                background: "rgba(14, 165, 233, 0.05)", padding: "1.5rem 1rem", textAlign: "center",
                transition: "all 0.2s ease", cursor: "pointer"
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(14, 165, 233, 0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(14, 165, 233, 0.05)"}
              >
            {selectedDocs.length > 0 ? (
              <div style={{ padding: '1rem', background: 'var(--table-sticky-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Archivos seleccionados ({selectedDocs.length}):</div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
                  {selectedDocs.map((f, i) => <li key={i}>{f.name}</li>)}
                </ul>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Haz clic para cambiar la selección)</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>
                  <CloudUpload size={28} style={{ margin: "0 auto" }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>Subir Archivos</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hacé clic para seleccionar PDF o Imágenes</div>
              </>
            )}
            <input 
              name="document" 
              type="file" 
              multiple 
              accept="image/*,application/pdf" 
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
              onChange={handleFileChange}
            />
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>Archivos para subir:</p>
                  {selectedFiles.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.8rem", background: "var(--glass-bg)", borderRadius: "10px", border: "1px solid var(--glass-border)", fontSize: "0.8rem", animation: "fadeIn 0.2s ease" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "80%" }}>
                        <FileText size={14} color="var(--primary)" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", background: "#f1f5f9", color: "#475569", borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s ease", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
              >Cancelar</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)", color: "white", borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s ease", border: "none", cursor: loading ? "wait" : "pointer", boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.3)", opacity: loading ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 10px -1px rgba(14, 165, 233, 0.4)"; } }}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(14, 165, 233, 0.3)"; } }}
              >{loading ? "Agendando..." : "Agendar Turno Seguro"}</button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

function SuggestionsDropdown({ suggestions, onSelect }: { suggestions: PatientSuggestion[]; onSelect: (p: PatientSuggestion) => void }) {
  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999,
      background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: "4px",
      maxHeight: "220px", overflowY: "auto"
    }}>
      <div style={{ padding: "0.4rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #f1f5f9", letterSpacing: "0.05em" }}>
        PACIENTES EXISTENTES
      </div>
      {suggestions.map((p) => (
        <button
          key={p.id}
          type="button"
          className="patient-suggestion"
          onMouseDown={(e) => { e.preventDefault(); onSelect(p); }}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            width: "100%", padding: "0.6rem 0.75rem", background: "transparent",
            border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s"
          }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(14,165,233,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={14} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>DNI: {p.dni} {p.health_insurance ? `· ${p.health_insurance}` : ""}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
