"use client";

import { useState, useEffect } from "react";
import { Search, User, Calendar, FileText, Plus, Send, CheckCircle, Clock, Trash2, Eye, Download, MessageSquare, FilePlus2, X } from "lucide-react";
import { searchPatients, getPatientAppointments, uploadMedicalResult, getAllMedicalResults, markAsNotified, markAllPendingAsNotified, deleteMedicalResult } from "@/actions/medical_results";
import Portal from "./Portal";
import { format } from "date-fns";
import { es } from 'date-fns/locale/es';

export default function MedicalResultsManager({ currentUser }: { currentUser: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  // Modal Step 1: History, Step 2: Upload
  const [modalStep, setModalStep] = useState(1);
  const [historySearch, setHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'notificado'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [editingGroup, setEditingGroup] = useState<any>(null); // For EditResultModal
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [bulkNotifying, setBulkNotifying] = useState(false);
  
  useEffect(() => {
    loadAllResults();
  }, []);

  async function loadAllResults() {
    const res = await getAllMedicalResults();
    if (res.data) setAllResults(res.data);
  }

  async function handleMarkAllPending() {
    const pending = allResults.filter(r => !r.notified_at);
    if (pending.length === 0) return;
    if (!confirm(`¿Marcar ${pending.length} resultado${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''} como notificado${pending.length !== 1 ? 's' : ''}?`)) return;
    setBulkNotifying(true);
    const res = await markAllPendingAsNotified();
    if (res.error) alert("Error: " + res.error);
    await loadAllResults();
    setBulkNotifying(false);
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch();
      } else {
        setPatients([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  async function handleSearch() {
    setLoading(true);
    const res = await searchPatients(searchQuery);
    if (res.data) setPatients(res.data);
    setLoading(false);
  }

  async function handleSelectPatient(patient: any) {
    setSelectedPatient(patient);
    setLoading(true);
    const res = await getPatientAppointments(patient.id);
    if (res.data) setAppointments(res.data);
    setLoading(false);
    setModalStep(1);
    setIsModalOpen(true);
    setSelectedFiles([]); // Reset files when opening
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("appointment_id", selectedApt.id);
    formData.append("patient_id", selectedPatient.id);
    
    const res = await uploadMedicalResult(formData);
    if (res.success) {
      setIsModalOpen(false);
      setSelectedApt(null);
      loadAllResults(); // Real-time refresh
    } else {
      alert("Error: " + res.error);
    }
    setUploading(false);
  }

  async function handleAddFilesToGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("appointment_id", editingGroup.appointment_id);
    formData.append("patient_id", editingGroup.patient_id);
    if (editingGroup.analysis_id) formData.append("analysis_id", editingGroup.analysis_id);
    
    const res = await uploadMedicalResult(formData);
    if (res.success) {
      loadAllResults(); // Real-time refresh
      setEditingGroup(null); // Close modal
    } else {
      alert("Error al subir archivo: " + res.error);
    }
    setUploading(false);
  }

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    border: "1px solid var(--glass-border)",
    background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
    color: 'var(--text-main)',
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s"
  };

  const filteredResults = allResults.filter(res => {
    const normalize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    const s = normalize(historySearch);
    
    const matchSearch = 
      normalize(res.patient_name).includes(s) || 
      res.patient_dni?.includes(s) || 
      normalize(res.report_id).includes(s) ||
      normalize(res.analysis_type).includes(s) ||
      normalize(res.notes).includes(s) ||
      normalize(res.uploaded_by_name).includes(s) ||
      (res.appointment_date && format(new Date(res.appointment_date), "dd/MM/yyyy").includes(s)) ||
      (res.created_at && format(new Date(res.created_at), "dd/MM/yyyy").includes(s));
      
    if (!matchSearch) return false;

    if (statusFilter === 'pendiente') return !res.notified_at;
    if (statusFilter === 'notificado') return !!res.notified_at;
    return true;
  });

  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const currentItems = filteredResults.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-main)' }}>ENTREGAR RESULTADO MEDICO</h2>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={20} />
          <input 
            type="text" 
            placeholder="Buscar paciente por nombre, DNI o N° de Informe..." 
            style={{ ...inputStyle, paddingLeft: '3rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {patients.map(p => (
          <div 
            key={p.id} 
            className="hoverable-card" 
            onClick={() => handleSelectPatient(p)}
            style={{ 
              padding: '1.5rem', 
              background: 'var(--glass-bg)', 
              borderRadius: '16px', 
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <User color="var(--primary)" size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>DNI: {p.dni}</p>
            </div>
          </div>
        ))}
        {loading && <p>Buscando...</p>}
        {!loading && searchQuery.length > 2 && patients.length === 0 && <p>No se encontraron pacientes.</p>}
      </div>

      {isModalOpen && (
        <Portal>
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "1rem"
          }}>
            <div className="glass-panel" style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '800px', 
            maxHeight: '92vh', 
            display: 'flex', 
            flexDirection: 'column', 
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  {modalStep === 1 ? <Calendar size={20} color="var(--primary)" /> : <FilePlus2 size={20} color="var(--primary)" />}
                  {modalStep === 1 ? `Historial de ${selectedPatient?.name}` : `Cargar Resultado Médico`}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'var(--text-main)' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {modalStep === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Seleccioná el turno al que querés asignar el resultado:</p>
                      {appointments.map(apt => (
                        <div 
                          key={apt.id} 
                          style={{ 
                            padding: '1.2rem', border: '1px solid var(--glass-border)', borderRadius: '16px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'all 0.2s', background: 'var(--glass-bg)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{format(new Date(apt.appointment_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <Clock size={14} /> {format(new Date(apt.appointment_date), "HH:mm")} hs — {apt.analysis_type}
                              {apt.report_id && <span style={{ color: 'var(--primary)', fontWeight: 900 }}>• INFORME {apt.report_id}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => { setSelectedApt(apt); setModalStep(2); }}
                              style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Plus size={16} /> Cargar Resultado
                            </button>
                            {currentUser?.role !== 'bioquimico' && (
                              <button 
                                onClick={() => {
                                  const msg = `Hola ${selectedPatient.name}, tu INFORME MÉDICO N° ${apt.report_id || '-'} del día ${format(new Date(apt.appointment_date), "dd/MM")} ya está disponible en: https://legalaboratorio.vercel.app/resultado`;
                                  window.open(`https://wa.me/${selectedPatient.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                style={{ padding: '0.5rem', borderRadius: '10px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center' }}
                                title="Avisar por WhatsApp"
                              >
                                <MessageSquare size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {appointments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                          <Calendar size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>No hay turnos registrados</p>
                        </div>
                      )}
                    </div>
                ) : (
                  <form id="upload-form" onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TURNO SELECCIONADO</p>
                      <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: 'var(--text-main)' }}>{format(new Date(selectedApt.appointment_date), "dd/MM/yyyy")} - {selectedApt.analysis_type}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ gridColumn: selectedApt.analyses?.length > 1 ? 'span 2' : 'span 1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Estudio correspondiente</label>
                        <select name="analysis_id" required style={inputStyle}>
                          {selectedApt.analyses?.length > 0 ? (
                            selectedApt.analyses.map((a: any) => (
                              <option key={a.id} value={a.id}>{a.name}{a.subtype ? ` (${a.subtype})` : ''}</option>
                            ))
                          ) : (
                            <option value="">{selectedApt.analysis_type}</option>
                          )}
                        </select>
                      </div>
                      <div style={{ gridColumn: selectedApt.analyses?.length > 1 ? 'span 1' : 'span 1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de Resultado</label>
                        <select name="type" required style={inputStyle}>
                          <option value="pdf">Documento PDF</option>
                          <option value="image">Imagen / Foto</option>
                          <option value="note">Nota Escrita</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: selectedApt.analyses?.length > 1 ? 'span 1' : 'span 1' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>N° INFORME</label>
                        <input name="report_id" defaultValue={selectedApt.report_id} placeholder="Ej: 94113" style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Contenido / Archivos</label>
                      
                      {/* Dropzone Design */}
                      <div 
                        onClick={() => document.getElementById('file-upload-results')?.click()}
                        style={{
                          border: '2.5px dashed var(--primary)',
                          borderRadius: '20px',
                          padding: '2.5rem',
                          textAlign: 'center',
                          background: 'rgba(14, 165, 233, 0.03)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          marginBottom: '1rem'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.08)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.03)';
                        }}
                      >
                        <div style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Subir Resultados Médicos</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hacé clic para seleccionar o arrastrá uno o varios archivos (PDF/Imagen)</div>
                        <input 
                          id="file-upload-results"
                          name="files" 
                          type="file" 
                          multiple 
                          accept="image/*,application/pdf" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            if (e.target.files) {
                              setSelectedFiles(Array.from(e.target.files));
                            }
                          }}
                        />
                      </div>

                      {selectedFiles.length > 0 && (
                        <div style={{ marginBottom: '1rem', background: 'rgba(14, 165, 233, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontWeight: 700 }}>Archivos Seleccionados ({selectedFiles.length}):</h5>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {selectedFiles.map((file, i) => (
                              <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={14} color="var(--success)" /> {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <textarea 
                        name="note_content" 
                        placeholder="Opcional: Agregá una nota o descripción para este resultado..." 
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => setModalStep(1)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>Atrás</button>
                      <button type="submit" disabled={uploading} style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: uploading ? 'wait' : 'pointer' }}>
                        {uploading ? 'Cargando...' : 'Guardar Resultado'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Historical Results Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
            <History size={28} color="var(--primary)" /> Últimos Resultados
            <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>({filteredResults.length})</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
              <button onClick={() => { setStatusFilter('todos'); setCurrentPage(1); }} style={{ padding: '0.5rem 1rem', background: statusFilter === 'todos' ? 'var(--primary)' : 'transparent', color: statusFilter === 'todos' ? 'white' : 'var(--text-main)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>Todos</button>
              <button onClick={() => { setStatusFilter('pendiente'); setCurrentPage(1); }} style={{ padding: '0.5rem 1rem', background: statusFilter === 'pendiente' ? '#dc2626' : 'transparent', color: statusFilter === 'pendiente' ? 'white' : 'var(--text-main)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>Pendiente aviso</button>
              <button onClick={() => { setStatusFilter('notificado'); setCurrentPage(1); }} style={{ padding: '0.5rem 1rem', background: statusFilter === 'notificado' ? '#16a34a' : 'transparent', color: statusFilter === 'notificado' ? 'white' : 'var(--text-main)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>Notificado</button>
            </div>
            {statusFilter === 'pendiente' && filteredResults.length > 0 && currentUser?.role !== 'bioquimico' && (
              <button
                onClick={handleMarkAllPending}
                disabled={bulkNotifying}
                title="Marcar todos los pendientes visibles como notificados"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', borderRadius: '10px',
                  background: bulkNotifying ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.15)',
                  color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)',
                  fontWeight: 800, fontSize: '0.82rem', cursor: bulkNotifying ? 'wait' : 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { if (!bulkNotifying) e.currentTarget.style.background = 'rgba(22,163,74,0.25)'; }}
                onMouseOut={(e) => { if (!bulkNotifying) e.currentTarget.style.background = 'rgba(22,163,74,0.15)'; }}
              >
                <CheckCircle size={15} />
                {bulkNotifying ? 'Marcando...' : `Marcar todos como notificados (${filteredResults.filter(r => !r.notified_at).length})`}
              </button>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.4rem 0.75rem', borderRadius: '12px' }}>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={validPage === 1} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: validPage === 1 ? 0.3 : 1, color: 'var(--text-main)' }}>&lt;</button>
              
              {isEditingPage ? (
                 <input 
                    autoFocus
                    type="number" 
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value)}
                    onBlur={() => {
                       const p = parseInt(pageInput);
                       if (!isNaN(p) && p >= 1 && p <= totalPages) setCurrentPage(p);
                       else setPageInput(validPage.toString());
                       setIsEditingPage(false);
                    }}
                    onKeyDown={e => {
                       if (e.key === 'Enter') {
                          const p = parseInt(pageInput);
                          if (!isNaN(p) && p >= 1 && p <= totalPages) setCurrentPage(p);
                          else setPageInput(validPage.toString());
                          setIsEditingPage(false);
                       }
                    }}
                    style={{ width: '40px', textAlign: 'center', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--text-main)', borderRadius: '4px', outline: 'none' }}
                 />
              ) : (
                 <span onDoubleClick={() => { setIsEditingPage(true); setPageInput(validPage.toString()); }} style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-main)' }} title="Doble clic para saltar a una página">
                   {validPage}
                 </span>
              )}
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>/ {totalPages}</span>

              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={validPage === totalPages} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: validPage === totalPages ? 0.3 : 1, color: 'var(--text-main)' }}>&gt;</button>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
              <input 
                type="text" 
                placeholder="Filtrar en toda la lista..." 
                style={{ ...inputStyle, padding: '0.6rem 1rem 0.6rem 2.8rem', fontSize: '0.9rem' }}
                value={historySearch}
                onChange={(e) => { setHistorySearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
        <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '1.25rem 1rem' }}>Fecha Carga</th>
                  <th style={{ padding: '1.25rem 1rem' }}>INFORME</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Paciente</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Turno</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Notas</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Cargado por</th>
                  <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((res: any) => (
                  <tr key={res.id} className="hoverable-row" style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{format(new Date(new Date(res.created_at).getTime() - 3 * 60 * 60 * 1000), "dd/MM/yyyy HH:mm")} hs</td>
                    <td style={{ padding: '1rem' }}>
                      {res.report_id ? (
                        <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 900, fontSize: '0.8rem' }}>
                          {res.report_id}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>{res.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {res.patient_dni}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {res.appointment_date ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{format(new Date(res.appointment_date), "dd/MM/yyyy")}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{res.analysis_type}</div>
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {res.files && res.files.length > 1 ? (
                        <span style={{ 
                          background: 'var(--primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800
                        }}>
                          {res.files.length} ARCHIVOS
                        </span>
                      ) : (
                        <span style={{ 
                          background: res.result_type === 'pdf' ? '#fee2e2' : (res.result_type === 'image' ? '#f0f9ff' : '#fef9c3'),
                          color: res.result_type === 'pdf' ? '#ef4444' : (res.result_type === 'image' ? 'var(--primary)' : '#ca8a04'),
                          padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
                        }}>
                          {res.result_type}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={res.notes}>
                        {res.notes || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{res.uploaded_by_name || 'Sistema'}</div>
                        {res.notified_at ? (
                          <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle size={10} /> Notificado {format(new Date(new Date(res.notified_at).getTime() - 3 * 60 * 60 * 1000), "dd/MM HH:mm")}
                          </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>Pendiente aviso</div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {currentUser?.role !== 'bioquimico' && (
                          <button 
                            onClick={async () => {
                              const msg = `\uD83D\uDC4B\uD83C\uDFFB Estimado paciente, Su Informe de Laboratorio N° ${res.report_id || '-'} del día ${format(new Date(res.appointment_date), "dd/MM")} ya se encuentra disponible en: https://laboratoriolega.vercel.app/resultado\n\nPara ingresar debe hacerlo con su N° de DNI\n\n¡Muchas gracias por elegirnos!\nSaludos \u2728`;
                              window.open(`https://wa.me/${res.patient_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                              await markAsNotified(res.id);
                              loadAllResults();
                            }}
                            style={{ padding: '0.4rem', borderRadius: '8px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center' }}
                            title="Avisar por WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                        <a 
                          href={`/api/medical-result/file/${res.id}`} 
                          target="_blank"
                          style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                          title={res.files && res.files.length > 1 ? "Ver primer archivo" : "Ver archivo"}
                        >
                          <Eye size={14} />
                        </a>
                        <button 
                          onClick={() => setEditingGroup(res)}
                          style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          title="Editar / Gestionar Archivos"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`¿Estás seguro de eliminar TODO el resultado (y sus archivos) de ${res.patient_name}?`)) {
                              setLoading(true);
                              if (res.files && res.files.length > 0) {
                                for (const f of res.files) {
                                  await deleteMedicalResult(f.id);
                                }
                              } else {
                                await deleteMedicalResult(res.id);
                              }
                              loadAllResults();
                              setLoading(false);
                            }
                          }}
                          style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                          title="Eliminar resultado"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingGroup && (
          <Portal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '24px', position: 'relative' }}>
                <button 
                  onClick={() => setEditingGroup(null)} 
                  style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={24} />
                </button>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                  <FilePlus2 /> Gestionar Archivos
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Archivos adjuntos para el informe de <strong>{editingGroup.patient_name}</strong>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {editingGroup.files && editingGroup.files.map((file: any, index: number) => (
                    <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(14, 165, 233, 0.05)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{index + 1}</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.filename || file.result_type}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={`/api/medical-result/file/${file.id}`} target="_blank" style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--glass-bg)', color: 'var(--primary)', cursor: 'pointer', border: '1px solid var(--glass-border)' }}>
                          <Eye size={14} />
                        </a>
                        <button 
                          onClick={async () => {
                            if (confirm('¿Eliminar este archivo?')) {
                              setLoading(true);
                              await deleteMedicalResult(file.id);
                              // Refrescar modal temporalmente recargando los datos
                              const newFiles = editingGroup.files.filter((f: any) => f.id !== file.id);
                              setEditingGroup({ ...editingGroup, files: newFiles });
                              loadAllResults();
                              setLoading(false);
                            }
                          }}
                          style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer', border: 'none' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddFilesToGroup} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Agregar nuevos archivos</h4>
                  <input type="hidden" name="type" value="pdf" />
                  <input type="file" name="files" multiple required style={inputStyle} accept="image/*,application/pdf" />
                  <button type="submit" disabled={uploading} style={{ width: '100%', padding: '0.8rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    {uploading ? 'Subiendo...' : 'Subir Archivos Extra'}
                  </button>
                </form>
              </div>
            </div>
          </Portal>
        )}
      </div>
  );
}

const History = ({ size, color }: { size: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);
