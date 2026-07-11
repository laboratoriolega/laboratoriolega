"use client";

import React, { useState, useMemo, useRef } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Download, ChevronDown, TrendingUp, Users, Activity, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AIR_TEST_NAMES = new Set(['SIBO', 'LACTOSA', 'FRUCTUOSA', 'SIBO C/LACTULON', 'AIRES']);

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const parseLocalDate = (dateStr: string, isEnd = false): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isEnd) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

interface IngresosReportsProps {
  data: any[];
  onBack: () => void;
}

const ANALYSIS_OPTIONS = ['SIBO', 'LACTOSA', 'FRUCTUOSA', 'SIBO C/LACTULON', 'PYLORI', 'EXTRACCION', 'MATERIA FECAL', 'ORINA', 'PANEL 105', 'PANEL 63', 'ALCAT', 'CIBIC'];
const OBRAS_SOCIALES_FILTER = ['OSDE', 'SWISS MEDICAL', 'GALENO', 'MEDIFE', 'CIBIC', 'METABOLOMICA', 'FEDERACION', 'ASOCIACION', 'APROSS', 'PARTICULAR'];

export default function IngresosReports({ data, onBack }: IngresosReportsProps) {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterAnalysis, setFilterAnalysis] = useState<string[]>([]);
  const [filterObraSocial, setFilterObraSocial] = useState('');
  const [filterProfessional, setFilterProfessional] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);

  // Filter data by date range + extra filters
  const filteredData = useMemo(() => {
    const startLimit = parseLocalDate(dateRange.start);
    const endLimit = parseLocalDate(dateRange.end, true);

    return data.filter(item => {
      const date = new Date(item.appointment_date);
      if (!isWithinInterval(date, { start: startLimit, end: endLimit })) return false;

      if (filterAnalysis.length > 0) {
        const itemTypes = item.analyses?.map((a: any) => (a.analysis_name || a.name || '').trim().toUpperCase()) ||
          [(item.analysis_type || '').trim().toUpperCase()];
        if (!filterAnalysis.some(fa => itemTypes.includes(fa.trim().toUpperCase()))) return false;
      }

      if (filterObraSocial) {
        if (!(item.health_insurance || '').toUpperCase().includes(filterObraSocial.toUpperCase())) return false;
      }

      if (filterProfessional) {
        if (!(item.professional_name || '').toLowerCase().includes(filterProfessional.toLowerCase())) return false;
      }

      return true;
    });
  }, [data, dateRange, filterAnalysis, filterObraSocial, filterProfessional]);

  // Statistics Processing
  const stats = useMemo(() => {
    const analysisMap: Record<string, number> = {};
    const airesMap: Record<string, number> = {};
    const insuranceMap: Record<string, number> = {};
    const professionalMap: Record<string, number> = {};
    const paymentMap: Record<string, number> = { 'Efectivo': 0, 'Transferencia': 0, 'Tarjeta': 0, 'Particular': 0, 'Obra Social': 0 };

    let totalRevenue = 0;
    let totalAgregadosCobrados = 0;

    filteredData.forEach(item => {
      // Multiple Analyses Support
      const itemAnalyses = item.analyses && item.analyses.length > 0
        ? item.analyses
        : [{ name: item.analysis_type || 'Otros' }];

      itemAnalyses.forEach((ana: any) => {
        let type = (ana.analysis_name || ana.name || 'Otros').trim().toUpperCase();
        // Remap generic 'TEST DE AIRE' to specific sub-type when available
        let isAire = false;
        let aireType = type;
        
        if (AIR_TEST_NAMES.has(type)) {
          if (item.aire_test_type) {
            type = item.aire_test_type.trim().toUpperCase();
            aireType = type;
          }
          isAire = true;
        } else if (type === 'SIBO' || type === 'SIBO C/LACTULON' || type === 'SIBO C/ LACTULON' || type === 'LACTOSA' || type === 'FRUCTUOSA' || type === 'PYLORI') {
          isAire = true;
        }

        analysisMap[type] = (analysisMap[type] || 0) + 1;
        
        if (isAire) {
          airesMap[aireType] = (airesMap[aireType] || 0) + 1;
        }
      });

      // Insurance
      const ins = item.health_insurance || 'Particular';
      insuranceMap[ins] = (insuranceMap[ins] || 0) + 1;

      // Professional
      const prof = item.professional_name || 'Sin especificar';
      professionalMap[prof] = (professionalMap[prof] || 0) + 1;

      // Payment logic
      if (item.particular_price) {
        paymentMap['Particular']++;
        totalRevenue += parseFloat(item.particular_price) || 0;
      }
      
      if (item.coseguro_agregado) {
        const pagado = parseFloat(item.total_coseguro_pagado) || 0;
        totalAgregadosCobrados += pagado;
        if (pagado > 0) {
          paymentMap['Obra Social']++;
          totalRevenue += pagado;
        }
      } else if (item.coseguro) {
        paymentMap['Obra Social']++;
        totalRevenue += parseFloat(item.coseguro) || 0;
      }
      
      const method = item.payment_method;
      if (method && paymentMap[method] !== undefined) {
        paymentMap[method]++;
      }
    });

    const toChartData = (map: Record<string, number>) => 
      Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
      analysisData: toChartData(analysisMap).slice(0, 7),
      airesData: toChartData(airesMap),
      insuranceData: toChartData(insuranceMap).slice(0, 7),
      professionalData: toChartData(professionalMap).slice(0, 7),
      paymentData: Object.entries(paymentMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0),
      totalEntries: filteredData.length,
      totalRevenue,
      totalAgregadosCobrados
    };
  }, [filteredData]);

  const exportPDF = async () => {
    setShowExportMenu(false);
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Reporte_Laboratorio_Lega_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  const exportCSV = () => {
    setShowExportMenu(false);
    const dateLabel = `${format(parseLocalDate(dateRange.start), 'dd/MM/yyyy')} al ${format(parseLocalDate(dateRange.end), 'dd/MM/yyyy')}`;
    const rows: string[] = [
      `Reporte Laboratorio Lega - ${dateLabel}`,
      '',
      'DISTRIBUCIÓN DE ESTUDIOS',
      'Estudio,Cantidad',
      ...stats.analysisData.map(d => `${d.name},${d.value}`),
      '',
      'COBERTURAS MÉDICAS',
      'Obra Social,Cantidad',
      ...stats.insuranceData.map(d => `${d.name},${d.value}`),
      '',
      'PACIENTES POR PROFESIONAL',
      'Profesional,Cantidad',
      ...stats.professionalData.map(d => `${d.name},${d.value}`),
      '',
      'MÉTODOS DE PAGO',
      'Método,Cantidad',
      ...stats.paymentData.map(d => `${d.name},${d.value}`),
      '',
      `Total pacientes,${stats.totalEntries}`,
      `Caja estimada,$${stats.totalRevenue.toLocaleString()}`,
      `Agregados cobrados,$${stats.totalAgregadosCobrados.toLocaleString()}`,
    ];
    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Laboratorio_Lega_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Controls Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DESDE</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HASTA</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600 }}
            />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(v => !v)}
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
              minWidth: '180px', overflow: 'hidden'
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
        </div>

        {/* Extra Filters Row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 180px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TIPO DE ANÁLISIS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {ANALYSIS_OPTIONS.map(opt => {
                const sel = filterAnalysis.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => setFilterAnalysis(sel ? filterAnalysis.filter(x => x !== opt) : [...filterAnalysis, opt])}
                    style={{
                      padding: '0.2rem 0.55rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      border: `1px solid ${sel ? 'var(--primary)' : 'var(--glass-border)'}`,
                      background: sel ? 'rgba(14,165,233,0.15)' : 'transparent',
                      color: sel ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
              {filterAnalysis.length > 0 && (
                <button onClick={() => setFilterAnalysis([])} style={{ padding: '0.2rem 0.45rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>OBRA SOCIAL</label>
            <select
              value={filterObraSocial}
              onChange={e => setFilterObraSocial(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <option value="">Todas</option>
              {OBRAS_SOCIALES_FILTER.map(os => <option key={os} value={os}>{os}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROFESIONAL</label>
            <input
              type="text"
              value={filterProfessional}
              onChange={e => setFilterProfessional(e.target.value)}
              placeholder="Buscar..."
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem' }}>
        {/* Header PDF only (simulated) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 900 }}>LABORATORIO LEGA</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Análisis Clínicos y Bacteriológicos</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 700 }}>REPORTE ESTADÍSTICO</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(parseLocalDate(dateRange.start), 'dd/MM/yy')} al {format(parseLocalDate(dateRange.end), 'dd/MM/yy')}</p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px' }}>
                <Users size={24} color="var(--primary)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL PACIENTES</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalEntries}</h3>
              </div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                <DollarSign size={24} color="var(--success)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CAJA ESTIMADA</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>$ {stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #8B5CF6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
                <DollarSign size={24} color="#8B5CF6" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AGREGADOS COBRADOS</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>$ {stats.totalAgregadosCobrados.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px' }}>
                <Activity size={24} color="var(--accent)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ESTUDIO TOP</p>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{stats.analysisData[0]?.name || '-'}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* Analysis Types Pie */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} /> Distribución de Estudios
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={stats.analysisData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent ? percent * 100 : 0).toFixed(0)}%)`}
                >
                  {stats.analysisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Test de aires */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} /> Test de aires
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={stats.airesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.airesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insurance Pie */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} /> Cobertura Médica (O. Sociales)
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={stats.insuranceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.insuranceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Professionals Bar */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Pacientes por Profesional
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={stats.professionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.75rem', fontWeight: 600 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payments Pie */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} /> Métodos de Pago y Facturación
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={stats.paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Particular' ? '#10B981' : (entry.name === 'Obra Social' ? '#0EA5E9' : COLORS[(index + 4) % COLORS.length])} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Professional Footer */}
        <div style={{ marginTop: '2rem', padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Documento generado automáticamente por el Sistema de Gestión Laboratorio Lega. 
          Confidencial y de uso interno. {format(new Date(), 'PPPP', { locale: es })}.
        </div>
      </div>
    </div>
  );
}
