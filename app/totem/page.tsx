"use client";

import { useState, useRef } from "react";
import { getPatientPortalData } from "@/actions/medical_results";
import {
  FileText, Download, MessageSquare, History, Search, User, LogOut,
  ChevronRight, CheckCircle, Info, Printer, X, Phone,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import VirtualKeyboard from "@/components/VirtualKeyboard";

export default function TotemPortal() {
  const [dni, setDni] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "history">("results");
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [portalSearch, setPortalSearch] = useState("");

  // Kiosk additions
  const [activeInput, setActiveInput] = useState<'dni' | 'search' | null>(null);
  const [showWA, setShowWA] = useState(false);
  const [printTarget, setPrintTarget] = useState<any>(null);
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  function handleVirtualKey(key: string) {
    if (activeInput === 'dni') {
      if (key === 'BACKSPACE') setDni(v => v.slice(0, -1));
      else setDni(v => v + key);
    } else if (activeInput === 'search') {
      if (key === 'BACKSPACE') setPortalSearch(v => v.slice(0, -1));
      else setPortalSearch(v => v + key);
    }
  }

  function handlePrint() {
    const iframe = printIframeRef.current;
    if (!iframe) return;
    iframe.contentWindow?.print();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (dni.length < 5) return;
    setActiveInput(null);
    setLoading(true);
    setError("");
    const res = await getPatientPortalData(dni);
    if (res.data) {
      setData(res.data);
    } else {
      setError(res.error || "No se encontraron datos para este DNI.");
    }
    setLoading(false);
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', paddingBottom: activeInput ? '320px' : '1.5rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
            <img src="/logo.png" alt="LEGA" style={{ width: '150px', maxWidth: '85%', height: 'auto', marginBottom: '1.5rem' }} />
            <div style={{ padding: '0.4rem 1.25rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              Tótem de Pacientes
            </div>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', color: '#1e293b', letterSpacing: '-0.02em' }}>Mis Resultados</h1>
          <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500, lineHeight: 1.6, fontSize: '1.05rem' }}>
            Tocá el campo e ingresá tu DNI usando el teclado en pantalla.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <User size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: '#0EA5E9' }} />
              <input
                type="text"
                inputMode="none"
                placeholder="Tocá aquí para ingresar tu DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onFocus={() => setActiveInput('dni')}
                onClick={() => setActiveInput('dni')}
                required
                readOnly
                style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '16px', border: activeInput === 'dni' ? '3px solid #0EA5E9' : '2px solid #e2e8f0', outline: 'none', fontSize: '1.3rem', fontWeight: 700, background: 'white', cursor: 'pointer', letterSpacing: '0.1em' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '1.1rem', fontSize: '1.15rem', borderRadius: '16px', width: '100%', fontWeight: 800, background: '#0EA5E9', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.4)', marginTop: '0.5rem' }}
            >
              {loading ? "Verificando..." : "VER MIS RESULTADOS →"}
            </button>
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700, border: '1px solid #fee2e2' }}>
                {error}
              </div>
            )}
          </form>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setShowWA(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.85rem', borderRadius: '12px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
            >
              <MessageSquare size={20} /> ¿Necesitás ayuda? Contactar
            </button>
          </div>
        </div>

        {activeInput && (
          <VirtualKeyboard
            mode="numeric"
            onKey={handleVirtualKey}
            onClose={() => setActiveInput(null)}
          />
        )}

        {showWA && <WAModal onClose={() => setShowWA(false)} />}
        <style jsx>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }

  const results = data.results || [];
  const appointments = data.appointments || [];

  const filteredResults = results.filter((res: any) => {
    const s = portalSearch.toLowerCase();
    const dateStr = res.appointment_date ? format(new Date(res.appointment_date), "dd/MM/yyyy") : "";
    return res.analysis_type?.toLowerCase().includes(s) || dateStr.includes(s) || res.report_id?.toLowerCase().includes(s);
  });

  const filteredAppointments = appointments.filter((apt: any) => {
    const s = portalSearch.toLowerCase();
    const dateStr = format(new Date(apt.appointment_date), "dd/MM/yyyy");
    return apt.analysis_type?.toLowerCase().includes(s) || dateStr.includes(s) || apt.report_id?.toLowerCase().includes(s);
  });

  // ── PORTAL SCREEN ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: activeInput ? '360px' : 0 }}>
      {/* Header */}
      <nav style={{ background: 'white', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src="/logo.png" alt="LEGA" style={{ height: '32px' }} />
          <div style={{ height: '20px', width: '1px', background: '#e2e8f0' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>{data.patient.name}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>DNI: {data.patient.dni}</p>
          </div>
        </div>
        <button
          onClick={() => { setData(null); setDni(""); setActiveInput(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 800, fontSize: '0.95rem', background: '#fef2f2', padding: '0.55rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={18} /> Salir
        </button>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('results')}
            style={{ padding: '0.85rem 1.5rem', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', background: activeTab === 'results' ? '#0EA5E9' : 'white', color: activeTab === 'results' ? 'white' : '#64748b', border: 'none', boxShadow: activeTab === 'results' ? '0 10px 15px -3px rgba(14, 165, 233, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <FileText size={22} /> RESULTADOS
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{ padding: '0.85rem 1.5rem', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', background: activeTab === 'history' ? '#0EA5E9' : 'white', color: activeTab === 'history' ? 'white' : '#64748b', border: 'none', boxShadow: activeTab === 'history' ? '0 10px 15px -3px rgba(14, 165, 233, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <History size={22} /> MI HISTORIAL
          </button>
          <button
            onClick={() => setShowWA(true)}
            style={{ marginLeft: 'auto', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
          >
            <MessageSquare size={18} /> Ayuda / Contacto
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
          <input
            type="text"
            inputMode="none"
            readOnly
            placeholder="Tocá aquí para buscar por fecha, análisis o N° informe..."
            value={portalSearch}
            onFocus={() => setActiveInput('search')}
            onClick={() => setActiveInput('search')}
            style={{ width: '100%', padding: '1.1rem 1.1rem 1.1rem 3.8rem', borderRadius: '20px', border: activeInput === 'search' ? '3px solid #0EA5E9' : '1px solid #e2e8f0', background: 'white', outline: 'none', fontSize: '1rem', fontWeight: 500, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' }}
          />
          {portalSearch && (
            <button
              onClick={() => setPortalSearch('')}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results Tab */}
        {activeTab === 'results' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredResults.length === 0 ? (
              <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ background: '#f0f9ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Info size={40} color="#0EA5E9" />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No hay resultados disponibles</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto', fontWeight: 500 }}>
                  {portalSearch ? "No hay resultados que coincidan." : "Tus informes aparecerán aquí una vez que el laboratorio los procese."}
                </p>
              </div>
            ) : (
              Object.values(filteredResults.reduce((acc: any, res: any) => {
                const key = res.appointment_id || res.id;
                if (!acc[key]) acc[key] = { id: key, date: res.appointment_date, report_id: res.report_id, items: [] };
                acc[key].items.push(res);
                return acc;
              }, {})).map((group: any) => (
                <div key={group.id} style={{ borderRadius: '24px', overflow: 'hidden', border: selectedResult?.appointment_id === group.id || selectedResult?.id === group.id ? '2px solid #0EA5E9' : '1px solid #e2e8f0', background: 'white', boxShadow: selectedResult?.appointment_id === group.id ? '0 20px 25px -5px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div
                    onClick={() => { const fi = group.items[0]; setSelectedResult(selectedResult?.id === fi.id ? null : fi); }}
                    style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ background: 'rgba(14,165,233,0.1)', padding: '1rem', borderRadius: '16px' }}>
                        <FileText color="#0EA5E9" size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                          {group.items.length > 1 ? `Múltiples Resultados (${group.items.length})` : (group.items[0].analysis_type || "Informe Médico")}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {group.report_id && <span style={{ fontSize: '0.75rem', background: '#0EA5E9', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 900 }}>N° {group.report_id}</span>}
                          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                            Turno del {format(new Date(group.date), "d 'de' MMMM, yyyy", { locale: es })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ transform: (selectedResult?.appointment_id === group.id || selectedResult?.id === group.id) ? 'rotate(90deg)' : 'none', transition: 'all 0.3s', opacity: 0.3 }} />
                  </div>

                  {(selectedResult?.appointment_id === group.id || selectedResult?.id === group.id) && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                      {group.items.length > 1 && (
                        <div style={{ padding: '1.25rem 0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                          {group.items.map((item: any) => (
                            <button key={item.id} onClick={() => setSelectedResult(item)} style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, background: selectedResult?.id === item.id ? '#0EA5E9' : 'rgba(14,165,233,0.05)', color: selectedResult?.id === item.id ? 'white' : '#0EA5E9', border: 'none', cursor: 'pointer' }}>
                              {item.analysis_type}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <CheckCircle size={18} color="#10B981" />
                        <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>{selectedResult?.analysis_type}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Cargado el {format(new Date(selectedResult?.created_at), "dd/MM/yyyy HH:mm")} hs
                        </span>
                      </div>

                      {selectedResult?.notes && (
                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e0f2fe' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Nota del Profesional:</p>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>{selectedResult?.notes}</p>
                        </div>
                      )}

                      {/* Inline viewer */}
                      <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '1.5rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {selectedResult?.result_type === 'pdf' ? (
                          <iframe src={`/api/medical-result/file/${selectedResult?.id}`} style={{ width: '100%', height: '650px', border: 'none' }} />
                        ) : selectedResult?.result_type === 'image' ? (
                          <img src={`/api/medical-result/file/${selectedResult?.id}`} alt="Resultado" style={{ maxWidth: '100%' }} />
                        ) : (
                          <div style={{ padding: '2rem', width: '100%', fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                            {selectedResult?.content}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setPrintTarget(selectedResult)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.75rem', background: 'white', border: '2px solid #0EA5E9', color: '#0EA5E9', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
                        >
                          <Printer size={20} /> IMPRIMIR INFORME
                        </button>
                        <button
                          onClick={() => setShowWA(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.75rem', background: '#25D366', color: 'white', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,211,102,0.3)' }}
                        >
                          <MessageSquare size={20} /> CONSULTAR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* History Tab */
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                  {['Fecha','N° Informe','Análisis / Estudio','Estado','Notas'].map(h => (
                    <th key={h} style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {filteredAppointments.map((apt: any) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: '#1e293b' }}>{format(new Date(apt.appointment_date), "dd/MM/yyyy")}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {apt.report_id
                        ? <span style={{ background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', padding: '0.3rem 0.7rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>{apt.report_id}</span>
                        : <span style={{ color: '#94a3b8' }}>-</span>}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: '#475569' }}>
                      {apt.analyses?.length > 0
                        ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>{apt.analyses.map((a: any, i: number) => <div key={i} style={{ fontSize: '0.8rem' }}>• {a.name}{a.subtype ? ` (${a.subtype})` : ''}</div>)}</div>
                        : apt.analysis_type}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ background: apt.status === 'COMPLETADO' ? '#dcfce7' : '#fee2e2', color: apt.status === 'COMPLETADO' ? '#166534' : '#991b1b', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {apt.status === 'COMPLETADO' ? 'LISTO' : apt.status}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{apt.notes || <span style={{ opacity: 0.3 }}>-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAppointments.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No se encontraron turnos.</div>
            )}
          </div>
        )}
      </main>

      {/* Virtual keyboard for search */}
      {activeInput === 'search' && (
        <VirtualKeyboard mode="text" onKey={handleVirtualKey} onClose={() => setActiveInput(null)} />
      )}

      {/* WhatsApp modal */}
      {showWA && <WAModal onClose={() => setShowWA(false)} />}

      {/* Print modal */}
      {printTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '860px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>Imprimir Informe</h3>
                {printTarget.report_id && <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>N° {printTarget.report_id}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handlePrint}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.4)' }}
                >
                  <Printer size={20} /> IMPRIMIR
                </button>
                <button
                  onClick={() => setPrintTarget(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} /> Cerrar
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {printTarget.result_type === 'image' ? (
                <img ref={(el) => { (printIframeRef as any).current = el; }} src={`/api/medical-result/file/${printTarget.id}`} alt="Resultado" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <iframe
                  ref={printIframeRef}
                  src={`/api/medical-result/file/${printTarget.id}`}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── WhatsApp Modal ────────────────────────────────────────────────────────────
function WAModal({ onClose }: { onClose: () => void }) {
  const phone = "+54 9 351 304-9709";

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 8500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', animation: 'fadeIn 0.25s ease' }}>
        {/* Green header */}
        <div style={{ background: '#25D366', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <MessageSquare size={32} color="#25D366" />
          </div>
          <h2 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1.4rem' }}>Contactar al Laboratorio</h2>
          <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600 }}>Estamos para ayudarte</p>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>
            Podés comunicarte con nosotros por WhatsApp desde tu celular:
          </p>

          <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Phone size={24} color="#15803d" />
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d', letterSpacing: '0.05em' }}>{phone}</span>
            </div>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Abrí WhatsApp en tu celular y escribinos al número de arriba,<br />o escaneá el código QR si lo tenemos disponible en el tótem.
          </p>

          <button
            onClick={onClose}
            style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
