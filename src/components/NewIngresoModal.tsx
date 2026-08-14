"use client";

import { useState, useEffect } from "react";
import { Search, ChevronRight, User, X, CloudUpload, FileText } from "lucide-react";
import HealthInsuranceInput from "./HealthInsuranceInput";
import ProfesionalInput from "./ProfesionalInput";
import TipoAnalisisInput from "./TipoAnalisisInput";
import { searchPatients } from "@/actions/medical_results";
import { getTodayAppointments } from "@/actions/appointments";
import { createIngreso, getNextReportId } from "@/actions/ingresos";
import PatientInsuranceSelector from "./PatientInsuranceSelector";

interface NewIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingIngreso?: any;
}

const PAYMENT_METHODS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'QR'];

function PaymentMethodSelector({ label, selectedMethods, onChange, inputName }: {
  label: string;
  selectedMethods: string[];
  onChange: (methods: string[]) => void;
  inputName: string;
}) {
  function toggle(m: string) {
    onChange(selectedMethods.includes(m) ? selectedMethods.filter(x => x !== m) : [...selectedMethods, m]);
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {PAYMENT_METHODS.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${selectedMethods.includes(m) ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: selectedMethods.includes(m) ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
              color: selectedMethods.includes(m) ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <input type="hidden" name={inputName} value={selectedMethods.join(',')} />
    </div>
  );
}

export default function NewIngresoModal({ isOpen, onClose, editingIngreso }: NewIngresoModalProps) {
  const [analyses, setAnalyses] = useState<{name: string, subtype: string}[]>([{name: "", subtype: ""}]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextReportId, setNextReportId] = useState("");
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [mode, setMode] = useState<"sin_turno" | "con_turno">("sin_turno");

  useEffect(() => {
    if (editingIngreso) {
      setSelectedPatient(editingIngreso);
      setMode("sin_turno");
      if (editingIngreso.analyses && editingIngreso.analyses.length > 0) {
        setAnalyses(editingIngreso.analyses.map((a: any) => ({ name: a.name, subtype: a.subtype })));
      } else {
        setAnalyses([{ name: editingIngreso.analysis_type || "", subtype: editingIngreso.aire_test_type || "" }]);
      }
    } else {
      setSelectedPatient(null);
      setMode("sin_turno");
      setAnalyses([{ name: "", subtype: "" }]);
      if (isOpen) fetchNextId();
    }
  }, [editingIngreso, isOpen]);

  useEffect(() => {
    if (!editingIngreso && selectedPatient) {
      if (selectedPatient.analyses && selectedPatient.analyses.length > 0) {
        setAnalyses(selectedPatient.analyses.map((a: any) => ({ name: a.name, subtype: a.subtype })));
      } else {
        setAnalyses([{ name: selectedPatient.analysis_type || "", subtype: selectedPatient.aire_test_type || "" }]);
      }
    }
  }, [selectedPatient, editingIngreso]);

  async function fetchNextId() {
    const res = await getNextReportId();
    if (res.success && res.nextId) setNextReportId(res.nextId);
  }

  useEffect(() => {
    if (isOpen && mode === "con_turno" && !editingIngreso) fetchToday();
  }, [isOpen, mode, editingIngreso]);

  async function fetchToday() {
    setLoadingToday(true);
    const res = await getTodayAppointments();
    if (res.data) setTodayAppointments(res.data);
    setLoadingToday(false);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.length > 2) handlePatientSearch();
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  async function handlePatientSearch() {
    const res = await searchPatients(searchQuery);
    if (res.data) setSearchResults(res.data);
  }

  function autofillPatient(patient: any) {
    setSelectedPatient(patient);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createIngreso(formData);
      if (res.error) setError(res.error);
      else onClose();
    } catch (err: any) {
      setError(err.message || "Error al cargar ingreso");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem", borderRadius: "8px",
    border: "1px solid var(--glass-border)", background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
    color: 'var(--text-main)', fontSize: "0.9rem", outline: "none", transition: 'all 0.2s'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem', animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '750px', maxHeight: '92vh', background: 'var(--glass-bg)',
        overflowY: 'auto', position: 'relative', borderRadius: '24px', border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--glass-bg)', zIndex: 10, backdropFilter: 'blur(10px)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              {editingIngreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              {editingIngreso ? 'Modificá los datos del ingreso' : 'Registrá la entrada de un paciente al laboratorio'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {!editingIngreso && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              {(['sin_turno', 'con_turno'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setSelectedPatient(null); }}
                  style={{
                    flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 700,
                    background: mode === m ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: mode === m ? 'white' : 'var(--text-muted)',
                    border: mode === m ? 'none' : '1px solid var(--glass-border)', transition: 'all 0.2s'
                  }}
                >
                  {m === 'sin_turno' ? 'SIN TURNO (Manual)' : 'CON TURNO (Agendados Hoy)'}
                </button>
              ))}
            </div>
          )}

          {mode === "con_turno" && !editingIngreso ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!selectedPatient ? (
                <>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Seleccioná el turno de hoy:</h4>
                  {loadingToday ? <p style={{ color: 'var(--text-muted)' }}>Cargando turnos...</p> : (
                    todayAppointments.map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedPatient(apt)}
                        style={{ padding: '1.25rem', border: '1px solid var(--glass-border)', borderRadius: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{apt.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>{apt.analysis_type} — DNI: {apt.dni}</div>
                        </div>
                        <ChevronRight size={20} color="var(--primary)" />
                      </div>
                    ))
                  )}
                  {todayAppointments.length === 0 && !loadingToday && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay turnos agendados para hoy.</p>}
                </>
              ) : (
                <IngresoForm mode={mode} nextReportId={nextReportId} selectedPatient={selectedPatient} editingIngreso={editingIngreso} setSelectedPatient={setSelectedPatient} handleSubmit={handleSubmit} loading={loading} error={error} inputStyle={inputStyle} searchResults={searchResults} searchQuery={searchQuery} setSearchQuery={setSearchQuery} autofillPatient={autofillPatient} onClose={onClose} analyses={analyses} setAnalyses={setAnalyses} />
              )}
            </div>
          ) : (
            <IngresoForm mode={mode} nextReportId={nextReportId} selectedPatient={selectedPatient} editingIngreso={editingIngreso} setSelectedPatient={setSelectedPatient} handleSubmit={handleSubmit} loading={loading} error={error} inputStyle={inputStyle} searchResults={searchResults} searchQuery={searchQuery} setSearchQuery={setSearchQuery} autofillPatient={autofillPatient} onClose={onClose} analyses={analyses} setAnalyses={setAnalyses} />
          )}
        </div>
      </div>
    </div>
  );
}

function IngresoForm({ mode, nextReportId, selectedPatient, editingIngreso, setSelectedPatient, handleSubmit, loading, error, inputStyle, searchResults, searchQuery, setSearchQuery, autofillPatient, onClose, analyses, setAnalyses }: any) {
  const addAnalysis = () => setAnalyses([...analyses, { name: "", subtype: "" }]);
  const removeAnalysis = (index: number) => setAnalyses(analyses.filter((_: any, i: number) => i !== index));
  const updateAnalysis = (index: number, field: string, value: string) => {
    const n = [...analyses]; n[index] = { ...n[index], [field]: value }; setAnalyses(n);
  };

  // src es el ingreso original (para fechas, pagos, etc.)
  // patientSrc es quien provee los datos personales: si el usuario seleccionó otro paciente, usar ese.
  const src = editingIngreso || selectedPatient;
  const patientSrc = selectedPatient || editingIngreso;

  const d = src?.appointment_date ? new Date(src.appointment_date) : new Date();
  const defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [appointmentDate, setAppointmentDate] = useState(defaultDate);

  // Campos de datos del paciente — controlados para que se actualicen al seleccionar otro paciente
  const [patientName, setPatientName] = useState(patientSrc?.name || '');
  const [patientDni, setPatientDni] = useState(patientSrc?.dni || '');
  const [patientPhone, setPatientPhone] = useState(patientSrc?.phone || '');
  const [patientEmail, setPatientEmail] = useState(patientSrc?.email || '');
  const [patientAddress, setPatientAddress] = useState(patientSrc?.address || '');
  const [patientBirthDate, setPatientBirthDate] = useState(
    patientSrc?.birth_date ? new Date(patientSrc.birth_date).toISOString().split('T')[0] : ''
  );
  const [patientInsurance, setPatientInsurance] = useState(patientSrc?.health_insurance || 'Particular');

  // Cuando el usuario elige otro paciente desde el buscador, actualizar todos los campos
  const prevPatientId = useState(patientSrc?.id)[0];
  useEffect(() => {
    if (selectedPatient && selectedPatient.id !== prevPatientId) {
      setPatientName(selectedPatient.name || '');
      setPatientDni(selectedPatient.dni || '');
      setPatientPhone(selectedPatient.phone || '');
      setPatientEmail(selectedPatient.email || '');
      setPatientAddress(selectedPatient.address || '');
      setPatientBirthDate(
        selectedPatient.birth_date ? new Date(selectedPatient.birth_date).toISOString().split('T')[0] : ''
      );
      setPatientInsurance(selectedPatient.health_insurance || 'Particular');
    }
  }, [selectedPatient]);

  const [coseguroVal, setCoseguroVal] = useState(src?.coseguro ? String(src.coseguro) : '');
  const [particularVal, setParticularVal] = useState(src?.particular_price ? String(src.particular_price) : '');
  const [coseguroAgregado, setCoseguroAgregado] = useState(src?.coseguro_agregado || false);
  const [facturaInstante, setFacturaInstante] = useState(src?.factura_instante || false);
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>(src?.payment_method || '-');
  const [paymentCombinado, setPaymentCombinado] = useState<boolean>(src?.payment_combined || false);
  const [coseguroMethods, setCoseguroMethods] = useState<string[]>(
    src?.coseguro_payment_method ? src.coseguro_payment_method.split(',').filter(Boolean) : []
  );
  const [particularMethods, setParticularMethods] = useState<string[]>(
    src?.particular_payment_method ? src.particular_payment_method.split(',').filter(Boolean) : []
  );

  const total = (parseFloat(coseguroVal) || 0) + (parseFloat(particularVal) || 0);

  return (
    <form
      key={selectedPatient?.id || 'new'}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {editingIngreso && <input type="hidden" name="id" value={editingIngreso.id} />}
      {mode === 'con_turno' && selectedPatient?.id && !editingIngreso && <input type="hidden" name="id" value={selectedPatient.id} />}
      <input type="hidden" name="coseguro_agregado" value={coseguroAgregado ? 'true' : ''} />
      <input type="hidden" name="factura_instante" value={facturaInstante ? 'true' : ''} />
      <input type="hidden" name="payment_combined" value={paymentCombinado ? 'true' : ''} />

      {error && <div style={{ color: 'var(--danger)', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Patient search */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Paciente</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nombre o DNI para autocompletar..." style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                {searchResults.map((p: any) => (
                  <div key={p.id} onClick={() => autofillPatient(p)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }} className="hoverable-row">
                    <span>{p.name}</span><span style={{ opacity: 0.5 }}>{p.dni}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Name / DNI */}
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Nombre Completo</label>
            <input name="name" required value={patientName} onChange={e => setPatientName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>DNI</label>
            <input name="dni" required value={patientDni} onChange={e => setPatientDni(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Nacimiento</label>
          <input name="birth_date" type="date" value={patientBirthDate} onChange={e => setPatientBirthDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Teléfono</label>
          <input name="phone" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Email</label>
          <input name="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Dirección</label>
          <input name="address" value={patientAddress} onChange={e => setPatientAddress(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />

        {/* Analyses */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Tipos de Estudios/Análisis</label>
            <button type="button" onClick={addAnalysis} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(14, 165, 233, 0.1)', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>+ AGREGAR ESTUDIO</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analyses.map((a: any, index: number) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <TipoAnalisisInput
                    name="analysis_name"
                    required
                    defaultValue={a.name}
                    onChange={(e) => updateAnalysis(index, 'name', e.target.value)}
                    placeholder="Seleccioná o escribí estudio..."
                    style={{ ...inputStyle, background: 'var(--glass-bg)' }}
                  />
                </div>
                {analyses.length > 1 && (
                  <button type="button" onClick={() => removeAnalysis(index)} style={{ padding: '0.5rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                )}
              </div>
            ))}
          </div>
          <input type="hidden" name="analyses_count" value={analyses.length} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Obra Social</label>
          <PatientInsuranceSelector
            patientId={selectedPatient?.id}
            selectedInsurance={patientInsurance}
            onSelect={(ins) => setPatientInsurance(ins)}
          />
          <HealthInsuranceInput
            key={patientInsurance}
            defaultValue={patientInsurance}
            listId="insurance-list-ingreso"
            style={{ ...inputStyle, background: 'var(--glass-bg)' }}
          />
        </div>

        {/* Dates / Report ID / Professional */}
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Fecha de Ingreso</label>
            <input name="appointment_date" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>N° INFORME</label>
            <input name="report_id" key={src?.report_id || nextReportId} defaultValue={src?.report_id || nextReportId} style={inputStyle} placeholder="Ej: 94113" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Fecha de Resultado</label>
            <input name="result_date" type="date" defaultValue={src?.result_date ? new Date(src.result_date).toISOString().split('T')[0] : ''} style={inputStyle} />
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Profesional(es)</label>
          <ProfesionalInput name="professional_name" defaultValue={src?.professional_name} style={inputStyle} placeholder="Nombre del médico" />
        </div>

        {/* Payment section */}
        <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }} />

        {/* Payment method row + Combinado checkbox */}
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Medio de Pago</label>
            <select
              name="payment_method"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              style={{ ...inputStyle, background: 'var(--glass-bg)', color: 'var(--text-main)' }}
            >
              <option value="-">-</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="QR">QR</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: paymentCombinado ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={paymentCombinado}
              onChange={e => setPaymentCombinado(e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            Combinado con Efectivo
          </label>
        </div>

        {/* Per-field method selectors (visible only when combined) */}
        {paymentCombinado && (
          <>
            <div>
              <PaymentMethodSelector
                label="Tipo de pago — Coseguro"
                selectedMethods={coseguroMethods}
                onChange={setCoseguroMethods}
                inputName="coseguro_payment_method"
              />
            </div>
            <div>
              <PaymentMethodSelector
                label="Tipo de pago — Particular"
                selectedMethods={particularMethods}
                onChange={setParticularMethods}
                inputName="particular_payment_method"
              />
            </div>
          </>
        )}

        {/* Coseguro + Particular + Total */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Coseguro O.Soc</label>
            <button
              type="button"
              onClick={() => setCoseguroAgregado((v: boolean) => !v)}
              style={{
                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                border: `1px solid ${coseguroAgregado ? 'var(--success)' : 'var(--glass-border)'}`,
                background: coseguroAgregado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                color: coseguroAgregado ? 'var(--success)' : 'var(--text-muted)',
              }}
              title="Marcar coseguro como 'Agregado' para seguimiento de pago en Obra Social"
            >
              {coseguroAgregado ? '✓ AGREGADO' : 'AGREGADO'}
            </button>
          </div>
          <input
            name="coseguro"
            type="number"
            step="0.01"
            value={coseguroVal}
            onChange={e => setCoseguroVal(e.target.value)}
            style={inputStyle}
            placeholder="$ 0.00"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Particular</label>
          <input
            name="particular_price"
            type="number"
            step="0.01"
            value={particularVal}
            onChange={e => setParticularVal(e.target.value)}
            style={inputStyle}
            placeholder="$ 0.00"
          />
        </div>

        {/* Total */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.06)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>
              $ {total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Observations */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>Observaciones / Detalles</label>
          <textarea name="observations" defaultValue={src?.observations} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Algún detalle adicional sobre el paciente o el estudio..." />
        </div>

        {/* Factura al instante */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem',
            borderRadius: '10px', cursor: 'pointer',
            border: `1px solid ${facturaInstante ? 'var(--primary)' : 'var(--glass-border)'}`,
            background: facturaInstante ? 'rgba(14, 165, 233, 0.07)' : 'transparent',
            transition: 'all 0.15s'
          }}>
            <input
              type="checkbox"
              checked={facturaInstante}
              onChange={e => setFacturaInstante(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Factura al instante</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registra este ingreso en el módulo de Cobranzas para facturación inmediata</div>
            </div>
          </label>
        </div>

        {/* Documentation */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Documentación Médica (Podés seleccionar varios)
          </label>
          <div
            onClick={() => document.getElementById('file-upload')?.click()}
            style={{ border: '2px dashed var(--primary)', borderRadius: '16px', padding: '2rem', textAlign: 'center', background: 'rgba(14, 165, 233, 0.02)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.02)'}
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
                <div style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>Subir Pedidos Médicos</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hacé clic aquí para seleccionar uno o varios archivos (PDF/Imagen)</div>
              </>
            )}
            <input 
              id="file-upload" 
              name="document" 
              type="file" 
              multiple 
              accept="image/*,application/pdf" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedDocs(Array.from(e.target.files));
                }
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 700 }}>
          {loading ? 'Cargando...' : 'Confirmar Ingreso'}
        </button>
      </div>
    </form>
  );
}
