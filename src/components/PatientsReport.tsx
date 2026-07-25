"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, Users, Activity, Shield, CalendarDays } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseLocalDate = (dateStr: string, isEnd = false): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isEnd) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const fmtDate = (iso: string) =>
  format(new Date(iso), 'dd/MM/yyyy', { locale: es });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientsReportProps {
  /** Todos los ingresos ya cargados por IngresosPageClient */
  data: any[];
  /** Lista de obras sociales de la BD (obras_sociales_catalog) */
  obrasSociales: string[];
  onBack: () => void;
}

interface ReportFilters {
  dateStart: string;
  dateEnd: string;
  obraSocial: string;
  patientName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PatientsReport({ data, obrasSociales, onBack }: PatientsReportProps) {
  // ── Filtros de formulario ──────────────────────────────────────────────
  const [filters, setFilters] = useState<ReportFilters>({
    dateStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dateEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    obraSocial: '',
    patientName: '',
  });

  // ── Estado de generación ──────────────────────────────────────────────
  const [generated, setGenerated] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters | null>(null);

  // ── Export ────────────────────────────────────────────────────────────
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ── Autocomplete de paciente ──────────────────────────────────────────
  const [showSuggestions, setShowSuggestions] = useState(false);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ── Ref para captura PDF ──────────────────────────────────────────────
  const reportRef = useRef<HTMLDivElement>(null);

  // ── Ref para el contenedor del menú de exportación ───────────────────
  const exportContainerRef = useRef<HTMLDivElement>(null);

  // Cierra los dropdowns al hacer click fuera de sus contenedores
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Cierra autocomplete de paciente
      if (
        patientInputRef.current && !patientInputRef.current.contains(e.target as Node) &&
        (!suggestionsRef.current || !suggestionsRef.current.contains(e.target as Node))
      ) {
        setShowSuggestions(false);
      }
      // Cierra menú exportar SOLO si el click fue fuera del contenedor
      if (
        showExportMenu &&
        exportContainerRef.current &&
        !exportContainerRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // ── Autocomplete suggestions ──────────────────────────────────────────
  const patientSuggestions = useMemo(() => {
    if (!filters.patientName.trim()) return [];
    const q = filters.patientName.toLowerCase();
    const names = Array.from(new Set(data.map((d) => d.name).filter(Boolean)));
    return names
      .filter((n: string) => n.toLowerCase().includes(q))
      .slice(0, 8);
  }, [filters.patientName, data]);

  // ── Datos filtrados (solo cuando se presiona "Generar Reporte") ───────
  const reportData = useMemo(() => {
    if (!appliedFilters) return [];

    const startLimit = parseLocalDate(appliedFilters.dateStart);
    const endLimit = parseLocalDate(appliedFilters.dateEnd, true);

    return data
      .filter((item) => {
        // Fecha
        const date = new Date(item.appointment_date);
        if (!isWithinInterval(date, { start: startLimit, end: endLimit })) return false;

        // Obra Social
        if (appliedFilters.obraSocial) {
          const hi = (item.health_insurance || '').toUpperCase();
          if (!hi.includes(appliedFilters.obraSocial.toUpperCase())) return false;
        }

        // Nombre de paciente
        if (appliedFilters.patientName.trim()) {
          const n = (item.name || '').toLowerCase();
          if (!n.includes(appliedFilters.patientName.trim().toLowerCase())) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      );
  }, [appliedFilters, data]);

  // ── Métricas del resumen ──────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalAtenciones = reportData.length;
    const distinctPatients = new Set(reportData.map((r) => r.name)).size;
    return { totalAtenciones, distinctPatients };
  }, [reportData]);

  // ── Etiquetas del encabezado ──────────────────────────────────────────
  const periodLabel = appliedFilters
    ? `${format(parseLocalDate(appliedFilters.dateStart), 'dd/MM/yyyy')} al ${format(
        parseLocalDate(appliedFilters.dateEnd),
        'dd/MM/yyyy'
      )}`
    : '';

  const obraSocialLabel = appliedFilters?.obraSocial || 'Todas';

  // ── Handlers ──────────────────────────────────────────────────────────
  function handleGenerate() {
    setAppliedFilters({ ...filters });
    setGenerated(true);
  }

  function setFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Resetea el reporte si se toca cualquier filtro
    setGenerated(false);
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────
  async function exportPDF() {
    setShowExportMenu(false);
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Reporte_Pacientes_Lega_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────
  function exportCSV() {
    setShowExportMenu(false);
    const rows: string[] = [
      `Reporte de Pacientes - Laboratorio Lega - ${periodLabel}`,
      `Obra Social: ${obraSocialLabel}`,
      '',
      'Fecha,Paciente,Obra Social',
      ...reportData.map(
        (r) =>
          `${fmtDate(r.appointment_date)},"${r.name || ''}","${r.health_insurance || ''}"`
      ),
      '',
      `Total de Atenciones,${summary.totalAtenciones}`,
      `Total de Pacientes Distintos,${summary.distinctPatients}`,
    ];
    const blob = new Blob(['\uFEFF' + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Pacientes_Lega_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Panel de filtros ───────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Fila superior: título + botón exportar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Filtros del Reporte
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Seleccioná el período y los filtros opcionales, luego presioná Generar Reporte.
            </p>
          </div>

          {generated && reportData.length > 0 && (
            <div ref={exportContainerRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowExportMenu((v) => !v); }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px' }}
              >
                <Download size={18} /> EXPORTAR <ChevronDown size={16} />
              </button>
              {showExportMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 500,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  minWidth: '190px', overflow: 'hidden',
                }}>
                  <button
                    onClick={exportPDF}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    <Download size={15} /> Descargar PDF
                  </button>
                  <button
                    onClick={exportCSV}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, borderTop: '1px solid var(--glass-border)' }}
                  >
                    <Download size={15} /> Descargar CSV (Excel)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fila de filtros */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Fecha Desde */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>FECHA DESDE</label>
            <input
              type="date"
              value={filters.dateStart}
              onChange={(e) => setFilter('dateStart', e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600 }}
            />
          </div>

          {/* Fecha Hasta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>FECHA HASTA</label>
            <input
              type="date"
              value={filters.dateEnd}
              onChange={(e) => setFilter('dateEnd', e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600 }}
            />
          </div>

          {/* Obra Social */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>OBRA SOCIAL</label>
            <select
              value={filters.obraSocial}
              onChange={(e) => setFilter('obraSocial', e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <option value="">Todas</option>
              {obrasSociales.map((os) => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>

          {/* Paciente con autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '220px', position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PACIENTE</label>
            <input
              ref={patientInputRef}
              type="text"
              value={filters.patientName}
              onChange={(e) => {
                setFilter('patientName', e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Buscar por nombre..."
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}
            />
            {showSuggestions && patientSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 600,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  maxHeight: '220px', overflowY: 'auto',
                }}
              >
                {patientSuggestions.map((name: string) => (
                  <button
                    key={name}
                    onClick={() => {
                      setFilter('patientName', name);
                      setShowSuggestions(false);
                    }}
                    style={{
                      display: 'block', width: '100%', padding: '0.6rem 0.85rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600,
                      textAlign: 'left', borderBottom: '1px solid var(--glass-border)',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(14,165,233,0.08)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'none'; }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Generar */}
          <button
            onClick={handleGenerate}
            className="btn-primary"
            disabled={!filters.dateStart || !filters.dateEnd}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.5rem', borderRadius: '10px', fontWeight: 700,
              fontSize: '0.9rem', alignSelf: 'flex-end',
              opacity: (!filters.dateStart || !filters.dateEnd) ? 0.5 : 1,
            }}
          >
            <Activity size={16} /> Generar Reporte
          </button>
        </div>
      </div>

      {/* ── Resultado del reporte ──────────────────────────────────────── */}
      {generated && (
        <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem' }}>

          {/* Encabezado PDF */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 900 }}>LABORATORIO LEGA</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Análisis Clínicos y Bacteriológicos</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>REPORTE DE PACIENTES</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Período: {periodLabel}
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Obra Social: {obraSocialLabel}
              </p>
              {appliedFilters?.patientName && (
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Paciente: {appliedFilters.patientName}
                </p>
              )}
            </div>
          </div>

          {/* Tarjetas de resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>

            {/* Total Atenciones */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(14,165,233,0.1)', borderRadius: '10px' }}>
                  <Activity size={22} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Atenciones</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{summary.totalAtenciones}</h3>
                </div>
              </div>
            </div>

            {/* Pacientes Distintos */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
                  <Users size={22} color="var(--success)" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pacientes Distintos</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{summary.distinctPatients}</h3>
                </div>
              </div>
            </div>

            {/* Obra Social */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(139,92,246,0.1)', borderRadius: '10px' }}>
                  <Shield size={22} color="#8B5CF6" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Obra Social</p>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {obraSocialLabel}
                  </h3>
                </div>
              </div>
            </div>

            {/* Período */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(56,189,248,0.1)', borderRadius: '10px' }}>
                  <CalendarDays size={22} color="var(--accent)" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Período</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {appliedFilters && format(parseLocalDate(appliedFilters.dateStart), 'dd/MM/yy')}
                    {' al '}
                    {appliedFilters && format(parseLocalDate(appliedFilters.dateEnd), 'dd/MM/yy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabla o mensaje vacío ───────────────────────────────── */}
          {reportData.length === 0 ? (
            <div className="glass-panel" style={{
              padding: '3rem', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
            }}>
              <Users size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                No se encontraron pacientes para los filtros seleccionados.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, opacity: 0.7 }}>
                Intentá ajustar el período o los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Listado de Pacientes
                <span style={{
                  marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700,
                  background: 'rgba(14,165,233,0.12)', color: 'var(--primary)',
                  padding: '0.2rem 0.65rem', borderRadius: '20px',
                }}>
                  {reportData.length} registros
                </span>
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Fecha</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Paciente</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Obra Social</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr
                        key={`${row.id}-${idx}`}
                        style={{
                          borderBottom: '1px solid var(--glass-border)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(14,165,233,0.025)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(14,165,233,0.07)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(14,165,233,0.025)'; }}
                      >
                        <td style={{ ...tdStyle, color: 'var(--text-muted)', fontWeight: 600, width: '48px' }}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {fmtDate(row.appointment_date)}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>
                          {row.name || '—'}
                        </td>
                        <td style={{ ...tdStyle }}>
                          {row.health_insurance ? (
                            <span style={{
                              display: 'inline-block', padding: '0.15rem 0.55rem',
                              borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                              background: 'rgba(14,165,233,0.1)', color: 'var(--primary)',
                              border: '1px solid rgba(14,165,233,0.2)',
                            }}>
                              {row.health_insurance}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '1rem', padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Documento generado automáticamente por el Sistema de Gestión Laboratorio Lega.
            Confidencial y de uso interno. {format(new Date(), 'PPPP', { locale: es })}.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos de tabla ────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontWeight: 800,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '0.7rem 1rem',
  color: 'var(--text-main)',
  fontSize: '0.875rem',
};
