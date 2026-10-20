"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, ChevronDown, Users, Activity, Shield, CalendarDays, X, DollarSign } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale/es';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getProfesionales, getTiposAnalisis } from '@/actions/listados';

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

const normalizeString = (str?: string) => {
  if (!str) return '';
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-zA-Z0-9\s]/g, " ") // Reemplazar puntuación/símbolos por espacio
    .replace(/\s+/g, " ")            // Colapsar múltiples espacios
    .toLowerCase()
    .trim();
};

const getRowIncome = (item: any): number => {
  const particular = parseFloat(item.particular_price) || 0;
  const coseguro = item.coseguro_agregado
    ? (parseFloat(item.total_coseguro_pagado) || parseFloat(item.coseguro) || 0)
    : (parseFloat(item.coseguro) || 0);
  return particular + coseguro;
};

const fmtMoney = (val: number): string =>
  `$${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  professionals: string[];
  professionalInput: string;
  analyses: string[];
  analysisInput: string;
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
    professionals: [],
    professionalInput: '',
    analyses: [],
    analysisInput: '',
  });

  // ── Estado de generación ──────────────────────────────────────────────
  const [generated, setGenerated] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters | null>(null);

  // ── Export ────────────────────────────────────────────────────────────
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ── Autocomplete states & refs ──────────────────────────────────────────
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const patientSuggestionsRef = useRef<HTMLDivElement>(null);

  const [showObraSocialSuggestions, setShowObraSocialSuggestions] = useState(false);
  const obraSocialInputRef = useRef<HTMLInputElement>(null);
  const obraSocialSuggestionsRef = useRef<HTMLDivElement>(null);

  const [showProfessionalSuggestions, setShowProfessionalSuggestions] = useState(false);
  const professionalInputRef = useRef<HTMLInputElement>(null);
  const professionalSuggestionsRef = useRef<HTMLDivElement>(null);

  const [showAnalysisSuggestions, setShowAnalysisSuggestions] = useState(false);
  const analysisInputRef = useRef<HTMLInputElement>(null);
  const analysisSuggestionsRef = useRef<HTMLDivElement>(null);

  // Cargar profesionales del admin
  const [profesionalesAdmin, setProfesionalesAdmin] = useState<string[]>([]);
  useEffect(() => {
    getProfesionales().then(res => {
      if (res.data) {
        setProfesionalesAdmin(res.data.filter((o: any) => o.activo).map((o: any) => o.nombre).sort());
      }
    });
  }, []);

  // Cargar tipos de análisis del admin
  const [tiposAnalisisAdmin, setTiposAnalisisAdmin] = useState<string[]>([]);
  useEffect(() => {
    getTiposAnalisis().then(res => {
      if (res.data) {
        setTiposAnalisisAdmin(res.data.filter((o: any) => o.activo).map((o: any) => o.nombre).sort());
      }
    });
  }, []);

  // ── Ref para captura PDF ──────────────────────────────────────────────
  const reportRef = useRef<HTMLDivElement>(null);

  // ── Ref para el contenedor del menú de exportación ───────────────────
  const exportContainerRef = useRef<HTMLDivElement>(null);

  // Cierra los dropdowns al hacer click fuera de sus contenedores
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Cierra autocompletes
      if (
        patientInputRef.current && !patientInputRef.current.contains(e.target as Node) &&
        (!patientSuggestionsRef.current || !patientSuggestionsRef.current.contains(e.target as Node))
      ) {
        setShowPatientSuggestions(false);
      }
      if (
        obraSocialInputRef.current && !obraSocialInputRef.current.contains(e.target as Node) &&
        (!obraSocialSuggestionsRef.current || !obraSocialSuggestionsRef.current.contains(e.target as Node))
      ) {
        setShowObraSocialSuggestions(false);
      }
      if (
        professionalInputRef.current && !professionalInputRef.current.contains(e.target as Node) &&
        (!professionalSuggestionsRef.current || !professionalSuggestionsRef.current.contains(e.target as Node))
      ) {
        setShowProfessionalSuggestions(false);
      }
      if (
        analysisInputRef.current && !analysisInputRef.current.contains(e.target as Node) &&
        (!analysisSuggestionsRef.current || !analysisSuggestionsRef.current.contains(e.target as Node))
      ) {
        setShowAnalysisSuggestions(false);
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
    const q = normalizeString(filters.patientName);
    const names = Array.from(new Set(data.map((d) => d.name).filter(Boolean)));
    return names
      .filter((n: string) => normalizeString(n).includes(q))
      .slice(0, 8);
  }, [filters.patientName, data]);

  const obraSocialSuggestions = useMemo(() => {
    if (!filters.obraSocial.trim()) return obrasSociales.slice(0, 8);
    const q = normalizeString(filters.obraSocial);
    return obrasSociales.filter((os) => normalizeString(os).includes(q)).slice(0, 8);
  }, [filters.obraSocial, obrasSociales]);

  const professionalSuggestions = useMemo(() => {
    const allProfs = Array.from(new Set([...profesionalesAdmin, ...data.map((d) => d.professional_name).filter(Boolean)])).sort() as string[];
    
    // Unificar por nombre normalizado
    const uniqueMap = new Map<string, string>();
    allProfs.forEach(p => {
      const norm = normalizeString(p);
      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, p);
      }
    });
    const uniqueProfs = Array.from(uniqueMap.values());

    if (!filters.professionalInput.trim()) return uniqueProfs.filter(p => !filters.professionals.includes(p)).slice(0, 8);
    
    const q = normalizeString(filters.professionalInput);
    return uniqueProfs
      .filter((p) => !filters.professionals.includes(p) && normalizeString(p).includes(q))
      .slice(0, 8);
  }, [filters.professionalInput, filters.professionals, profesionalesAdmin, data]);

  const analysisSuggestions = useMemo(() => {
    const fromData: string[] = [];
    data.forEach((d) => {
      if (d.analysis_type) {
        d.analysis_type.split(/[,;\/]+/).forEach((part: string) => {
          const trimmed = part.trim();
          if (trimmed) fromData.push(trimmed);
        });
      }
      if (d.aire_test_type && d.aire_test_type.trim()) {
        fromData.push(d.aire_test_type.trim());
      }
      if (Array.isArray(d.analyses)) {
        d.analyses.forEach((a: any) => {
          if (a?.name && a.name.trim()) fromData.push(a.name.trim());
          if (a?.subtype && a.subtype.trim()) fromData.push(a.subtype.trim());
        });
      }
    });

    const normalizeCanonical = (name: string): string => {
      const norm = normalizeString(name);
      if (norm === 'curva' || norm === 'curvas' || norm === 'curva pab' || norm === 'curvas pab') {
        return 'CURVAS PAB';
      }
      if (norm === 'extraccion pab' || norm === 'extraccion - endocrinologia' || norm === 'extraccion endocrinologia' || norm === 'extraccion endocrinologica') {
        return 'EXTRACCION PAB';
      }
      if (norm === 'extraccion') {
        return 'EXTRACCIÓN';
      }
      return name.trim();
    };

    const allAnalyses = Array.from(new Set([...tiposAnalisisAdmin, ...fromData]))
      .filter(Boolean)
      .map(s => normalizeCanonical(s))
      .filter(s => s.length > 0)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    const uniqueMap = new Map<string, string>();
    allAnalyses.forEach(a => {
      const norm = normalizeString(a);
      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, a);
      }
    });
    const uniqueAnalyses = Array.from(uniqueMap.values());

    if (!filters.analysisInput.trim()) {
      return uniqueAnalyses.filter(a => !filters.analyses.includes(a)).slice(0, 8);
    }

    const q = normalizeString(filters.analysisInput);
    return uniqueAnalyses
      .filter(a => !filters.analyses.includes(a) && normalizeString(a).includes(q))
      .slice(0, 8);
  }, [filters.analysisInput, filters.analyses, tiposAnalisisAdmin, data]);

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
          const hi = normalizeString(item.health_insurance);
          if (!hi.includes(normalizeString(appliedFilters.obraSocial))) return false;
        }

        // Nombre de paciente
        if (appliedFilters.patientName.trim()) {
          const n = normalizeString(item.name);
          if (!n.includes(normalizeString(appliedFilters.patientName))) return false;
        }

        // Profesionales
        if (appliedFilters.professionals && appliedFilters.professionals.length > 0) {
          const profNorm = normalizeString(item.professional_name);
          const match = appliedFilters.professionals.some(p => profNorm.includes(normalizeString(p)));
          if (!match) return false;
        }

        // Tipos de Análisis
        if (appliedFilters.analyses && appliedFilters.analyses.length > 0) {
          const itemAnalyses: string[] = [];
          if (item.analysis_type) {
            item.analysis_type.split(/[,;\/]+/).forEach((s: string) => {
              const trimmed = s.trim();
              if (trimmed) itemAnalyses.push(trimmed);
            });
          }
          if (item.aire_test_type && item.aire_test_type.trim()) {
            itemAnalyses.push(item.aire_test_type.trim());
          }
          if (Array.isArray(item.analyses)) {
            item.analyses.forEach((a: any) => {
              if (a?.name && a.name.trim()) itemAnalyses.push(a.name.trim());
              if (a?.subtype && a.subtype.trim()) itemAnalyses.push(a.subtype.trim());
            });
          }

          const isPabExtraccion = (s: string) =>
            s === 'extraccion pab' ||
            s === 'extraccion - endocrinologia' ||
            s === 'extraccion endocrinologia' ||
            s === 'extraccion endocrinologica';

          const isCurva = (s: string) =>
            s === 'curva' ||
            s === 'curvas' ||
            s === 'curva pab' ||
            s === 'curvas pab';

          const isAnalysisMatch = (itemAnalysis: string, filterAnalysis: string): boolean => {
            const itemNorm = normalizeString(itemAnalysis);
            const selNorm = normalizeString(filterAnalysis);
            if (!itemNorm || !selNorm) return false;

            // 1. Curvas PAB
            if (isCurva(selNorm)) {
              return isCurva(itemNorm);
            }
            if (isCurva(itemNorm)) {
              return isCurva(selNorm);
            }

            // 2. Extracción PAB
            if (isPabExtraccion(selNorm)) {
              return isPabExtraccion(itemNorm);
            }
            if (isPabExtraccion(itemNorm)) {
              return isPabExtraccion(selNorm);
            }

            // 3. Regular Extracción
            if (selNorm === 'extraccion') {
              return itemNorm === 'extraccion';
            }
            if (itemNorm === 'extraccion') {
              return selNorm === 'extraccion';
            }

            // 4. Exact equality
            if (itemNorm === selNorm) return true;

            // 5. Clean comparison (without parentheses/subtypes if present)
            const itemClean = itemNorm.replace(/\(.*?\)/g, '').trim();
            const selClean = selNorm.replace(/\(.*?\)/g, '').trim();
            if (itemClean === selClean && itemClean.length > 0) return true;

            return false;
          };

          const matchAnalysis = appliedFilters.analyses.some(sel =>
            itemAnalyses.some(itemAna => isAnalysisMatch(itemAna, sel))
          );

          if (!matchAnalysis) return false;
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
    const totalIngresos = reportData.reduce((acc, r) => acc + getRowIncome(r), 0);
    return { totalAtenciones, distinctPatients, totalIngresos };
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
      windowHeight: reportRef.current.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 2) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Reporte_Pacientes_Lega_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────
  function exportCSV() {
    setShowExportMenu(false);
    const rows: string[] = [
      `Reporte de Pacientes - Laboratorio Lega - ${periodLabel}`,
      `Obra Social: ${obraSocialLabel}`,
      ...(appliedFilters?.analyses && appliedFilters.analyses.length > 0
        ? [`Análisis: ${appliedFilters.analyses.join(', ')}`]
        : []),
      ...(appliedFilters?.patientName ? [`Paciente: ${appliedFilters.patientName}`] : []),
      ...(appliedFilters?.professionals && appliedFilters.professionals.length > 0
        ? [`Profesional: ${appliedFilters.professionals.join(', ')}`]
        : []),
      '',
      'Fecha,Paciente,Obra Social,Análisis,Profesional,Ingreso $',
      ...reportData.map((r) => {
        const inc = getRowIncome(r);
        const anaStr = (r.analyses && r.analyses.length > 0)
          ? r.analyses.map((a: any) => a.name + (a.subtype ? ` (${a.subtype})` : '')).join(', ')
          : (r.analysis_type || '');
        return `${fmtDate(r.appointment_date)},"${(r.name || '').replace(/"/g, '""')}","${(r.health_insurance || '').replace(/"/g, '""')}","${anaStr.replace(/"/g, '""')}","${(r.professional_name || '').replace(/"/g, '""')}",${inc.toFixed(2)}`;
      }),
      '',
      `Total de Atenciones,${summary.totalAtenciones}`,
      `Total de Pacientes Distintos,${summary.distinctPatients}`,
      `Total Ingresos Registrados,${summary.totalIngresos.toFixed(2)}`,
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

          {/* Obra Social con autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '220px', position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>OBRA SOCIAL</label>
            <input
              ref={obraSocialInputRef}
              type="text"
              value={filters.obraSocial}
              onChange={(e) => {
                setFilter('obraSocial', e.target.value);
                setShowObraSocialSuggestions(true);
              }}
              onFocus={() => setShowObraSocialSuggestions(true)}
              placeholder="Escribir o seleccionar..."
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}
            />
            {showObraSocialSuggestions && obraSocialSuggestions.length > 0 && (
              <div
                ref={obraSocialSuggestionsRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 600,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  maxHeight: '220px', overflowY: 'auto',
                }}
              >
                {obraSocialSuggestions.map((name: string) => (
                  <button
                    key={name}
                    onClick={() => {
                      setFilter('obraSocial', name);
                      setShowObraSocialSuggestions(false);
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

          {/* Tipo de Análisis con autocomplete multiple */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '240px', position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TIPO DE ANÁLISIS</label>
            <div
              onClick={() => { setShowAnalysisSuggestions(true); analysisInputRef.current?.focus(); }}
              style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center',
                padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)', cursor: 'text', minHeight: '38px'
              }}
            >
              {filters.analyses.map(opt => (
                <span
                  key={opt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6',
                    border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '20px',
                    padding: '0.15rem 0.55rem 0.15rem 0.65rem', fontSize: '0.75rem', fontWeight: 600,
                  }}
                >
                  {opt}
                  <button
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault(); e.stopPropagation();
                      setFilters(prev => ({ ...prev, analyses: prev.analyses.filter(o => o !== opt) }));
                      setGenerated(false);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B5CF6', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}

              <input
                ref={analysisInputRef}
                type="text"
                value={filters.analysisInput}
                onChange={(e) => {
                  setFilter('analysisInput', e.target.value);
                  setShowAnalysisSuggestions(true);
                }}
                onFocus={() => setShowAnalysisSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && filters.analysisInput === '' && filters.analyses.length > 0) {
                    setFilters(prev => ({ ...prev, analyses: prev.analyses.slice(0, -1) }));
                    setGenerated(false);
                  }
                }}
                placeholder={filters.analyses.length === 0 ? "Escribir o seleccionar..." : ""}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  color: 'var(--text-main)', fontSize: '0.85rem', flex: 1, minWidth: '80px', fontWeight: 600
                }}
              />
            </div>
            {showAnalysisSuggestions && analysisSuggestions.length > 0 && (
              <div
                ref={analysisSuggestionsRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 600,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  maxHeight: '220px', overflowY: 'auto',
                }}
              >
                {analysisSuggestions.map((name: string) => (
                  <button
                    key={name}
                    onClick={() => {
                      setFilters(prev => ({ 
                        ...prev, 
                        analyses: [...prev.analyses, name],
                        analysisInput: '' 
                      }));
                      setShowAnalysisSuggestions(false);
                      setGenerated(false);
                    }}
                    style={{
                      display: 'block', width: '100%', padding: '0.6rem 0.85rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600,
                      textAlign: 'left', borderBottom: '1px solid var(--glass-border)',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(139,92,246,0.08)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'none'; }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profesional con autocomplete multiple */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '240px', position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROFESIONALES</label>
            <div
              onClick={() => { setShowProfessionalSuggestions(true); professionalInputRef.current?.focus(); }}
              style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center',
                padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)', cursor: 'text', minHeight: '38px'
              }}
            >
              {filters.professionals.map(opt => (
                <span
                  key={opt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(14, 165, 233, 0.15)', color: 'var(--primary)',
                    border: '1px solid rgba(14, 165, 233, 0.35)', borderRadius: '20px',
                    padding: '0.15rem 0.55rem 0.15rem 0.65rem', fontSize: '0.75rem', fontWeight: 600,
                  }}
                >
                  {opt}
                  <button
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault(); e.stopPropagation();
                      setFilters(prev => ({ ...prev, professionals: prev.professionals.filter(o => o !== opt) }));
                      setGenerated(false);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}

              <input
                ref={professionalInputRef}
                type="text"
                value={filters.professionalInput}
                onChange={(e) => {
                  setFilter('professionalInput', e.target.value);
                  setShowProfessionalSuggestions(true);
                }}
                onFocus={() => setShowProfessionalSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && filters.professionalInput === '' && filters.professionals.length > 0) {
                    setFilters(prev => ({ ...prev, professionals: prev.professionals.slice(0, -1) }));
                    setGenerated(false);
                  }
                }}
                placeholder={filters.professionals.length === 0 ? "Escribir o seleccionar..." : ""}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  color: 'var(--text-main)', fontSize: '0.85rem', flex: 1, minWidth: '80px', fontWeight: 600
                }}
              />
            </div>
            {showProfessionalSuggestions && professionalSuggestions.length > 0 && (
              <div
                ref={professionalSuggestionsRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 600,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  maxHeight: '220px', overflowY: 'auto',
                }}
              >
                {professionalSuggestions.map((name: string) => (
                  <button
                    key={name}
                    onClick={() => {
                      setFilters(prev => ({ 
                        ...prev, 
                        professionals: [...prev.professionals, name],
                        professionalInput: '' 
                      }));
                      setShowProfessionalSuggestions(false);
                      setGenerated(false);
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

          {/* Paciente con autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '220px', position: 'relative' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PACIENTE</label>
            <input
              ref={patientInputRef}
              type="text"
              value={filters.patientName}
              onChange={(e) => {
                setFilter('patientName', e.target.value);
                setShowPatientSuggestions(true);
              }}
              onFocus={() => setShowPatientSuggestions(true)}
              placeholder="Buscar por nombre..."
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}
            />
            {showPatientSuggestions && patientSuggestions.length > 0 && (
              <div
                ref={patientSuggestionsRef}
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
                      setShowPatientSuggestions(false);
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
              {appliedFilters?.analyses && appliedFilters.analyses.length > 0 && (
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Análisis: {appliedFilters.analyses.join(', ')}
                </p>
              )}
              {appliedFilters?.patientName && (
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Paciente: {appliedFilters.patientName}
                </p>
              )}
              {appliedFilters?.professionals && appliedFilters.professionals.length > 0 && (
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Profesional: {appliedFilters.professionals.join(', ')}
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
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #6366F1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(99,102,241,0.1)', borderRadius: '10px' }}>
                  <Users size={22} color="#6366F1" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pacientes Distintos</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{summary.distinctPatients}</h3>
                </div>
              </div>
            </div>

            {/* Ingresos Registrados */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.65rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
                  <DollarSign size={22} color="#10B981" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingresos Registrados</p>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#10B981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fmtMoney(summary.totalIngresos)}
                  </h3>
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

            {/* Análisis (si está filtrado) */}
            {appliedFilters?.analyses && appliedFilters.analyses.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #EC4899' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ padding: '0.65rem', background: 'rgba(236,72,153,0.1)', borderRadius: '10px' }}>
                    <Activity size={22} color="#EC4899" />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Análisis</p>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={appliedFilters.analyses.join(', ')}>
                      {appliedFilters.analyses.join(', ')}
                    </h3>
                  </div>
                </div>
              </div>
            )}

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
                      <th style={{ ...thStyle, textAlign: 'left' }}>Análisis</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Profesional</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Ingreso $</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => {
                      const rowIncome = getRowIncome(row);
                      const anaStr = (row.analyses && row.analyses.length > 0)
                        ? row.analyses.map((a: any) => a.name + (a.subtype ? ` (${a.subtype})` : '')).join(', ')
                        : (row.analysis_type || '');
                      return (
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
                          <td style={{ ...tdStyle }}>
                            {anaStr ? (
                              <span style={{
                                display: 'inline-block', padding: '0.15rem 0.55rem',
                                borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                                background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                                border: '1px solid rgba(139,92,246,0.2)',
                              }}>
                                {anaStr}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>—</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600, fontSize: '0.8rem' }}>
                            {row.professional_name || '—'}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {rowIncome > 0 ? (
                              <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                                {fmtMoney(rowIncome)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                                $0,00
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(14,165,233,0.04)' }}>
                      <td colSpan={6} style={{ ...tdStyle, fontWeight: 800, textAlign: 'right', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Total Ingresos Registrados:
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 900, textAlign: 'right', fontSize: '0.95rem', color: 'var(--success)', whiteSpace: 'nowrap' }}>
                        {fmtMoney(summary.totalIngresos)}
                      </td>
                    </tr>
                  </tfoot>
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
