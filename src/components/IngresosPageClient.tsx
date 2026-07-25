"use client";

import { useState, useEffect } from "react";
import { getIngresos } from "@/actions/ingresos";
import IngresosTable from "@/components/IngresosTable";
import NewIngresoModal from "@/components/NewIngresoModal";
import { Plus, Filter, Activity, ArrowLeft, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSearchParams } from "next/navigation";

import IngresosReports from "@/components/IngresosReports";
import PatientsReport from "@/components/PatientsReport";

export default function IngresosPageClient({
  userRole,
  obrasSociales = [],
}: {
  userRole: string;
  obrasSociales?: string[];
}) {
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "reports" | "patients">("table");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MMMM yyyy', { locale: es }));
  const [bioqFilter, setBioqFilter] = useState<string>('');
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'con' | 'sin'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [resultDateFilter, setResultDateFilter] = useState<string>('');

  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight');

  const isBioq = userRole === 'bioquimico';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const res = await getIngresos();
    if (res.data) setIngresos(res.data);
    setLoading(false);
  }

  function handleEdit(ingreso: any) {
    setEditingIngreso(ingreso);
    setIsModalOpen(true);
  }

  const availableMonths = Array.from(new Set(ingresos.map(ing =>
    format(new Date(ing.appointment_date), 'MMMM yyyy', { locale: es })
  ))).sort((a, b) => {
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
    return monthNames.indexOf(monthB) - monthNames.indexOf(monthA);
  });

  useEffect(() => {
    if (!loading && ingresos.length > 0 && !availableMonths.includes(selectedMonth)) {
      const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es });
      if (!availableMonths.includes(currentMonth) && availableMonths.length > 0) {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [loading, ingresos, availableMonths, selectedMonth]);

  useEffect(() => {
    if (highlightId && ingresos.length > 0) {
      const highlightedIngreso = ingresos.find(i => i.id === parseInt(highlightId));
      if (highlightedIngreso) {
        const monthOfHighlight = format(new Date(highlightedIngreso.appointment_date), 'MMMM yyyy', { locale: es });
        if (selectedMonth !== monthOfHighlight) {
          setSelectedMonth(monthOfHighlight);
        }
        // clear the date filter so the row is visible, or set it to the specific date
        setDateFilter(''); 
      }
    }
  }, [highlightId, ingresos]);

  const filteredIngresos = ingresos.filter(ing => {
    const monthYear = format(new Date(ing.appointment_date), 'MMMM yyyy', { locale: es });
    if (monthYear !== selectedMonth) return false;

    if (dateFilter) {
      const ingDate = format(new Date(ing.appointment_date), 'yyyy-MM-dd');
      if (ingDate !== dateFilter) return false;
    }

    if (resultDateFilter) {
      if (!ing.result_date) return false;
      const rDate = format(new Date(ing.result_date), 'yyyy-MM-dd');
      if (rDate !== resultDateFilter) return false;
    }

    if (checklistFilter === 'con' && !ing.checkbox_checked) return false;
    if (checklistFilter === 'sin' && ing.checkbox_checked) return false;
    
    if (bioqFilter && ing.biochemical_notice !== bioqFilter) {
      return false;
    }
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      ing.name?.toLowerCase().includes(s) ||
      ing.dni?.toLowerCase().includes(s) ||
      ing.report_id?.toLowerCase().includes(s) ||
      ing.analysis_type?.toLowerCase().includes(s) ||
      ing.professional_name?.toLowerCase().includes(s) ||
      ing.health_insurance?.toLowerCase().includes(s) ||
      ing.address?.toLowerCase().includes(s) ||
      ing.email?.toLowerCase().includes(s) ||
      ing.payment_method?.toLowerCase().includes(s) ||
      format(new Date(ing.appointment_date), 'dd/MM/yyyy').includes(s)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {view === 'table' ? 'Ingresos' : view === 'reports' ? 'Reporte Estadístico' : 'Reporte de Pacientes'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            {view === 'table'
              ? 'Registro histórico y detallado de entrada de pacientes y cobros.'
              : view === 'reports'
              ? 'Visualización estadística de estudios, pacientes y facturación.'
              : 'Consulta operativa de pacientes atendidos en un período.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!isBioq && view !== 'table' && (
            <button
              onClick={() => setView('table')}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem',
                borderRadius: '14px', fontSize: '1rem', background: 'var(--success)',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
              }}
            >
              <ArrowLeft size={22} /> VOLVER A LISTA
            </button>
          )}
          {!isBioq && view === 'table' && (
            <>
              <button
                onClick={() => setView('reports')}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem',
                  borderRadius: '14px', fontSize: '1rem',
                }}
              >
                <Activity size={22} /> REPORTE ESTADÍSTICO
              </button>
              <button
                onClick={() => setView('patients')}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem',
                  borderRadius: '14px', fontSize: '1rem',
                  background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Users size={22} /> REPORTE DE PACIENTES
              </button>
            </>
          )}

          {view === 'table' && !isBioq && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderRadius: '14px', fontSize: '1rem' }}
            >
              <Plus size={22} /> NUEVO INGRESO
            </button>
          )}
        </div>
      </div>

      {view === 'table' && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
          {availableMonths.length === 0 && !loading && (
            <div className="glass-panel" style={{ padding: '0.5rem 1.5rem', borderRadius: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              No hay datos históricos
            </div>
          )}
          {availableMonths.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--glass-border)',
                background: selectedMonth === month ? 'var(--primary)' : 'var(--glass-bg)',
                color: selectedMonth === month ? 'white' : 'var(--text-main)',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s', textTransform: 'capitalize',
                boxShadow: selectedMonth === month ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
              }}
            >
              {month}
            </button>
          ))}
        </div>
      )}

      {view === 'table' ? (
        <>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, DNI, informe, estudio, obra social..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '12px',
                    border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                    fontWeight: 600, fontSize: '0.95rem', outline: 'none', color: 'var(--text-main)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{filteredIngresos.length}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Encontrados</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setBioqFilter(bioqFilter === 'LISTO P/ ENVIAR' ? '' : 'LISTO P/ ENVIAR')}
                style={{
                  padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${bioqFilter === 'LISTO P/ ENVIAR' ? '#166534' : 'var(--glass-border)'}`,
                  background: bioqFilter === 'LISTO P/ ENVIAR' ? '#dcfce7' : 'var(--glass-bg)',
                  color: bioqFilter === 'LISTO P/ ENVIAR' ? '#166534' : 'var(--text-muted)'
                }}
              >LISTO P/ ENVIAR</button>
              <button
                onClick={() => setBioqFilter(bioqFilter === 'RTO PARCIALES' ? '' : 'RTO PARCIALES')}
                style={{
                  padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${bioqFilter === 'RTO PARCIALES' ? '#9a3412' : 'var(--glass-border)'}`,
                  background: bioqFilter === 'RTO PARCIALES' ? '#ffedd5' : 'var(--glass-bg)',
                  color: bioqFilter === 'RTO PARCIALES' ? '#9a3412' : 'var(--text-muted)'
                }}
              >RTO PARCIALES</button>
              <button
                onClick={() => setBioqFilter(bioqFilter === 'PAC AVISADO' ? '' : 'PAC AVISADO')}
                style={{
                  padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${bioqFilter === 'PAC AVISADO' ? '#0369a1' : 'var(--glass-border)'}`,
                  background: bioqFilter === 'PAC AVISADO' ? '#e0f2fe' : 'var(--glass-bg)',
                  color: bioqFilter === 'PAC AVISADO' ? '#0369a1' : 'var(--text-muted)'
                }}
              >PAC AVISADO</button>
              <select
                value={checklistFilter}
                onChange={(e) => setChecklistFilter(e.target.value as 'all' | 'con' | 'sin')}
                style={{
                  padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${checklistFilter !== 'all' ? '#4f46e5' : 'var(--glass-border)'}`,
                  background: checklistFilter !== 'all' ? '#e0e7ff' : 'var(--glass-bg)',
                  color: checklistFilter !== 'all' ? '#4f46e5' : 'var(--text-muted)',
                  outline: 'none',
                  appearance: 'none',
                  textAlign: 'center'
                }}
              >
                <option value="all">✔️</option>
                <option value="con">Con ✔️</option>
                <option value="sin">Sin ✔️</option>
              </select>
              <button
                onClick={fetchData}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem',
                  borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                  fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                <Activity size={18} /> Actualizar
              </button>
            </div>
          </div>

          {(loading && ingresos.length === 0) ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ marginBottom: '1rem' }}><Activity size={40} /></div>
              Cargando ingresos históricos...
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {loading && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100, background: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <div className="animate-spin" style={{ display: 'inline-block' }}><Activity size={12} /></div>
                  Sincronizando...
                </div>
              )}
              <IngresosTable 
                ingresos={filteredIngresos} 
                onEdit={handleEdit} 
                onRefresh={fetchData} 
                period="all" 
                userRole={userRole} 
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                resultDateFilter={resultDateFilter}
                setResultDateFilter={setResultDateFilter}
              />
            </div>
          )}
        </>
      ) : view === 'reports' ? (
        <IngresosReports data={ingresos} onBack={() => setView('table')} />
      ) : (
        <PatientsReport data={ingresos} obrasSociales={obrasSociales} onBack={() => setView('table')} />
      )}

      {!isBioq && (
        <NewIngresoModal
          isOpen={isModalOpen}
          editingIngreso={editingIngreso}
          onClose={() => {
            setIsModalOpen(false);
            setEditingIngreso(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
