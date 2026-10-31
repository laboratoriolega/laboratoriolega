"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from 'date-fns/locale/es';
import { Clock, ChevronLeft, ChevronRight, Wind, AlertCircle, Edit2, CheckCircle, MessageSquare, Loader2, Ban } from "lucide-react";
import { toggleIndicationsStatus } from "@/actions/appointments";
import BlockedDaysPanel from "./BlockedDaysPanel";
import { useRouter } from "next/navigation";
import AppointmentModal from "./AppointmentModal";
import EditAppointmentModal from "./EditAppointmentModal";
import EvolutionModal from "./EvolutionModal";
import MoveReasonModal from "./MoveReasonModal";

type BlockedDay = { id: number; fecha: string; descripcion: string | null; created_by?: string | null };

type PabCategory = 'CURVAS_PAB' | 'CURVAS_ARGININA' | 'CURVAS_CLONIDINA' | 'EXTRACCION_PAB' | 'OTHER';

const PAB_COLORS: Record<PabCategory, string> = {
  CURVAS_PAB: '#F59E0B',        // Ámbar
  CURVAS_ARGININA: '#06B6D4',   // Cian / Celeste
  CURVAS_CLONIDINA: '#EC4899',  // Rosa / Magenta
  EXTRACCION_PAB: '#8B5CF6',    // Violeta / Púrpura
  OTHER: 'var(--primary)',      // Primario / Dinámico
};

export default function PabCalendarView({
  appointments,
  blockedDays: initialBlockedDays,
}: {
  appointments: any[];
  blockedDays: BlockedDay[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAp, setSelectedAp] = useState<any>(null);
  const [selectedApForEvolution, setSelectedApForEvolution] = useState<any>(null);
  const [isMovingModalOpen, setIsMovingModalOpen] = useState(false);
  const [movingAppt, setMovingAppt] = useState<{ id: string, targetDate: string } | null>(null);

  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>(initialBlockedDays);
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => { setBlockedDays(initialBlockedDays); }, [initialBlockedDays]);

  if (!appointments) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysGrid: Date[] = [];
  let day = startDate;
  while (day <= endDate) { daysGrid.push(day); day = addDays(day, 1); }

  const isCurvaType = (type?: string | null): boolean => {
    if (!type) return false;
    const t = type.toUpperCase().trim();
    return (
      t === 'CURVA' ||
      t === 'CURVAS' ||
      t === 'CURVA PAB' ||
      t === 'CURVAS PAB' ||
      t.startsWith('CURVAS PAB') ||
      t.startsWith('CURVA PAB') ||
      t.includes('CURVA') ||
      t.includes('ARGININA') ||
      t.includes('CLONIDINA')
    );
  };

  const isExtraccionPabType = (type?: string | null): boolean => {
    if (!type) return false;
    const t = type.toUpperCase().trim();
    return (
      t === 'EXTRACCIÓN - ENDOCRINOLOGÍA' ||
      t === 'EXTRACCION - ENDOCRINOLOGIA' ||
      t === 'EXTRACCION PAB' ||
      t === 'EXTRACCIÓN PAB' ||
      t.includes('EXTRACCION PAB') ||
      t.includes('EXTRACCIÓN PAB')
    );
  };

  const isPabMatch = (val?: string | null): boolean => {
    if (!val) return false;
    const t = val.toUpperCase().trim();
    return isCurvaType(t) || isExtraccionPabType(t) || t.includes('PAB');
  };

  const getPabCategory = (type?: string | null): PabCategory => {
    if (!type) return 'OTHER';
    const u = type.toUpperCase().trim();
    if (u.includes('ARGININA')) return 'CURVAS_ARGININA';
    if (u.includes('CLONIDINA')) return 'CURVAS_CLONIDINA';
    if (isExtraccionPabType(u)) return 'EXTRACCION_PAB';
    if (isCurvaType(u)) return 'CURVAS_PAB';
    return 'OTHER';
  };

  // Resolve the effective PAB test type from multiple possible sources
  function resolveTestType(apt: any): string | undefined {
    if (apt.aire_test_type && isPabMatch(apt.aire_test_type)) return apt.aire_test_type;
    // Fall back to analyses array subtype or name
    if (apt.analyses && apt.analyses.length > 0) {
      const arginina = apt.analyses.find((a: any) => 
        (a.subtype && a.subtype.toUpperCase().includes('ARGININA')) || 
        (a.name && a.name.toUpperCase().includes('ARGININA'))
      );
      if (arginina) return arginina.subtype || arginina.name;

      const clonidina = apt.analyses.find((a: any) => 
        (a.subtype && a.subtype.toUpperCase().includes('CLONIDINA')) || 
        (a.name && a.name.toUpperCase().includes('CLONIDINA'))
      );
      if (clonidina) return clonidina.subtype || clonidina.name;

      const curva = apt.analyses.find((a: any) => 
        isCurvaType(a.subtype) || isCurvaType(a.name)
      );
      if (curva) return curva.subtype || curva.name;

      const extraccion = apt.analyses.find((a: any) => 
        isExtraccionPabType(a.subtype) || isExtraccionPabType(a.name)
      );
      if (extraccion) return extraccion.subtype || extraccion.name;

      const pabAnalysis = apt.analyses.find((a: any) => 
        isPabMatch(a.subtype) || isPabMatch(a.name)
      );
      if (pabAnalysis) return pabAnalysis.subtype || pabAnalysis.name;
    }
    return apt.analysis_type;
  }

  const airesAppts = (appointments || []).filter(a =>
    a &&
    (
      isPabMatch(a.analysis_type) || 
      (a.aire_test_type && isPabMatch(a.aire_test_type)) || 
      (a.analyses && a.analyses.some((ana: any) => isPabMatch(ana.subtype) || isPabMatch(ana.name)))
    ) &&
    !a.is_domicilio
  );

  const currentMonthAppts = airesAppts.filter(a => a && a.appointment_date && isSameMonth(new Date(a.appointment_date), monthStart));
  const completedThisMonth = currentMonthAppts.filter(a => a?.status === 'COMPLETADO').length;

  const curvaPabTotal = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'CURVAS_PAB').length;
  const curvaPabCompleted = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'CURVAS_PAB' && a?.status === 'COMPLETADO').length;

  const argininaTotal = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'CURVAS_ARGININA').length;
  const argininaCompleted = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'CURVAS_ARGININA' && a?.status === 'COMPLETADO').length;

  const clonidinaTotal = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'CURVAS_CLONIDINA').length;
  const clonidinaCompleted = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'CURVAS_CLONIDINA' && a?.status === 'COMPLETADO').length;

  const extraccionTotal = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'EXTRACCION_PAB').length;
  const extraccionCompleted = currentMonthAppts.filter(a => getPabCategory(resolveTestType(a)) === 'EXTRACCION_PAB' && a?.status === 'COMPLETADO').length;

  // Dynamic types for any other PAB study not in the 4 known categories
  const dynamicTypesMap = new Map<string, { total: number; completed: number }>();
  currentMonthAppts.forEach(a => {
    const effective = resolveTestType(a);
    const cat = getPabCategory(effective);
    if (cat === 'OTHER' && effective) {
      const t = effective.toUpperCase().trim();
      const prev = dynamicTypesMap.get(t) || { total: 0, completed: 0 };
      dynamicTypesMap.set(t, {
        total: prev.total + 1,
        completed: prev.completed + (a?.status === 'COMPLETADO' ? 1 : 0),
      });
    }
  });

  function getBlockedInfo(d: Date): BlockedDay | null {
    const key = format(d, 'yyyy-MM-dd');
    return blockedDays.find(b => b.fecha.slice(0, 10) === key) || null;
  }

  const getTypeStyle = (type?: string, status?: string) => {
    let base = { border: '1px solid var(--glass-border)', borderLeft: '5px solid var(--glass-border)', background: 'var(--glass-bg)', opacity: 1 };
    if (status === 'CANCELADO') return { ...base, opacity: 0.5, background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderLeft: '5px solid #94a3b8' };
    
    const cat = getPabCategory(type);
    if (cat === 'CURVAS_PAB') {
      base = { ...base, border: '1px solid #F59E0B', borderLeft: '5px solid #F59E0B', background: status === 'COMPLETADO' ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.06)' };
    } else if (cat === 'CURVAS_ARGININA') {
      base = { ...base, border: '1px solid #06B6D4', borderLeft: '5px solid #06B6D4', background: status === 'COMPLETADO' ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.06)' };
    } else if (cat === 'CURVAS_CLONIDINA') {
      base = { ...base, border: '1px solid #EC4899', borderLeft: '5px solid #EC4899', background: status === 'COMPLETADO' ? 'rgba(236,72,153,0.12)' : 'rgba(236,72,153,0.06)' };
    } else if (cat === 'EXTRACCION_PAB') {
      base = { ...base, border: '1px solid #8B5CF6', borderLeft: '5px solid #8B5CF6', background: status === 'COMPLETADO' ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.05)' };
    } else {
      base = { ...base, border: '1px solid var(--primary)', borderLeft: '5px solid var(--primary)', background: status === 'COMPLETADO' ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.05)' };
    }

    if (status === 'COMPLETADO') { base.border = '1px solid var(--success)'; base.borderLeft = '5px solid var(--success)'; }
    return base;
  };

  const getBadgeColor = (type?: string) => {
    const cat = getPabCategory(type);
    return PAB_COLORS[cat] || PAB_COLORS.OTHER;
  };

  function formatSinglePabName(name?: string | null): string {
    if (!name) return '';
    const cat = getPabCategory(name);
    if (cat === 'CURVAS_ARGININA') return 'CURVAS ARGININA';
    if (cat === 'CURVAS_CLONIDINA') return 'CURVAS CLONIDINA';
    if (cat === 'CURVAS_PAB') return 'CURVAS PAB';
    if (cat === 'EXTRACCION_PAB') return 'EXTRACCIÓN PAB';
    return name.toUpperCase().trim();
  }

  function formatPabDisplayType(apt: any): string {
    if (apt.analyses && apt.analyses.length > 1) {
      return apt.analyses.map((a: any) => formatSinglePabName(a.name || a.subtype)).filter(Boolean).join(' + ');
    }
    const effective = resolveTestType(apt);
    return formatSinglePabName(effective) || (apt.analyses && apt.analyses.length > 0 ? apt.analyses[0].name : 'Prueba');
  }

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ minWidth: '200px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wind size={24} color="var(--primary)" /> Turnos PAB
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{currentMonthAppts.length} turnos este mes ({completedThisMonth} completados)</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBlockedPanel(!showBlockedPanel)}
            style={{
              padding: '0.5rem 1rem',
              background: showBlockedPanel ? 'rgba(239,68,68,0.1)' : 'var(--glass-bg)',
              borderRadius: '8px',
              border: `1px solid ${showBlockedPanel ? '#EF4444' : 'var(--glass-border)'}`,
              color: showBlockedPanel ? '#EF4444' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontWeight: 600, fontSize: '0.85rem',
            }}
          >
            <Ban size={16} /> Feriados {blockedDays.length > 0 && `(${blockedDays.length})`}
          </button>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 800, minWidth: '180px', textAlign: 'center', fontSize: '1.25rem', color: 'var(--text-main)' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      {showBlockedPanel && <BlockedDaysPanel blockedDays={blockedDays} calendarType="pab" />}

      <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setTypeFilter('ALL')}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${typeFilter === 'ALL' ? 'var(--primary)' : 'var(--glass-border)'}`,
            background: typeFilter === 'ALL' ? 'rgba(14, 165, 233, 0.15)' : 'var(--glass-bg)',
            color: typeFilter === 'ALL' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          TODOS ({currentMonthAppts.length})
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter(prev => prev === 'CURVAS_PAB' ? 'ALL' : 'CURVAS_PAB')}
          title={`${curvaPabTotal} turnos (${curvaPabCompleted} completados)`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${typeFilter === 'CURVAS_PAB' ? '#F59E0B' : 'var(--glass-border)'}`,
            background: typeFilter === 'CURVAS_PAB' ? 'rgba(245, 158, 11, 0.2)' : 'var(--glass-bg)',
            color: '#F59E0B',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F59E0B' }}></span>
          CURVAS PAB ({curvaPabTotal}/{curvaPabCompleted})
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter(prev => prev === 'CURVAS_ARGININA' ? 'ALL' : 'CURVAS_ARGININA')}
          title={`${argininaTotal} turnos (${argininaCompleted} completados)`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${typeFilter === 'CURVAS_ARGININA' ? '#06B6D4' : 'var(--glass-border)'}`,
            background: typeFilter === 'CURVAS_ARGININA' ? 'rgba(6, 182, 212, 0.2)' : 'var(--glass-bg)',
            color: '#06B6D4',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#06B6D4' }}></span>
          CURVAS ARGININA ({argininaTotal}/{argininaCompleted})
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter(prev => prev === 'CURVAS_CLONIDINA' ? 'ALL' : 'CURVAS_CLONIDINA')}
          title={`${clonidinaTotal} turnos (${clonidinaCompleted} completados)`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${typeFilter === 'CURVAS_CLONIDINA' ? '#EC4899' : 'var(--glass-border)'}`,
            background: typeFilter === 'CURVAS_CLONIDINA' ? 'rgba(236, 72, 153, 0.2)' : 'var(--glass-bg)',
            color: '#EC4899',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#EC4899' }}></span>
          CURVAS CLONIDINA ({clonidinaTotal}/{clonidinaCompleted})
        </button>

        <button
          type="button"
          onClick={() => setTypeFilter(prev => prev === 'EXTRACCION_PAB' ? 'ALL' : 'EXTRACCION_PAB')}
          title={`${extraccionTotal} turnos (${extraccionCompleted} completados)`}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${typeFilter === 'EXTRACCION_PAB' ? '#8B5CF6' : 'var(--glass-border)'}`,
            background: typeFilter === 'EXTRACCION_PAB' ? 'rgba(139, 92, 246, 0.2)' : 'var(--glass-bg)',
            color: '#8B5CF6',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#8B5CF6' }}></span>
          EXTRACCIÓN PAB ({extraccionTotal}/{extraccionCompleted})
        </button>

        {/* Dynamic types (any new type not in the 4 known ones) */}
        {Array.from(dynamicTypesMap.entries()).map(([type, data]) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(prev => prev === type ? 'ALL' : type)}
            title={`${data.total} turnos (${data.completed} completados)`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: `1px solid ${typeFilter === type ? 'var(--primary)' : 'var(--glass-border)'}`,
              background: typeFilter === type ? 'rgba(14, 165, 233, 0.2)' : 'var(--glass-bg)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--primary)' }}></span>
            {type} ({data.total}/{data.completed})
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#EF4444', marginLeft: 'auto' }}>
          <Ban size={12} color="#EF4444" /> SIN ATENCIÓN
        </div>
      </div>

      <div style={{ overflowX: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', minWidth: '800px', paddingBottom: '1rem' }}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
            <div key={d} style={{ fontWeight: 600, textAlign: 'center', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>{d}</div>
          ))}

          {daysGrid.map(day => {
            const rawDayAppts = (airesAppts || []).filter(a => a && a.appointment_date && isSameDay(new Date(a.appointment_date), day));
            const activeDayAppts = rawDayAppts.filter(a => a.status !== 'CANCELADO');
            const dayAppts = rawDayAppts.filter(a => {
              if (typeFilter === 'ALL') return true;
              const effective = resolveTestType(a);
              const cat = getPabCategory(effective);
              if (typeFilter === 'CURVAS_PAB') return cat === 'CURVAS_PAB';
              if (typeFilter === 'CURVAS_ARGININA') return cat === 'CURVAS_ARGININA';
              if (typeFilter === 'CURVAS_CLONIDINA') return cat === 'CURVAS_CLONIDINA';
              if (typeFilter === 'EXTRACCION_PAB') return cat === 'EXTRACCION_PAB';
              return (effective || '').toUpperCase().trim() === typeFilter;
            });
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const isThursday = day.getDay() === 4;
            const curvaCount = activeDayAppts.filter(a => isCurvaType(resolveTestType(a))).length;
            const isCurvaFull = isThursday && curvaCount >= 3;
            const blocked = getBlockedInfo(day);
            const isBlocked = blocked !== null;

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  if (isBlocked) return;
                  setSelectedDate(day);
                  setIsModalOpen(true);
                }}
                onDragOver={(e) => {
                  if (isBlocked) return;
                  e.preventDefault();
                  e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                }}
                onDragLeave={(e) => {
                  if (isBlocked) return;
                  e.currentTarget.style.background = isCurrentMonth ? 'var(--glass-bg)' : 'rgba(0,0,0,0.05)';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isBlocked) return;
                  e.currentTarget.style.background = isCurrentMonth ? 'var(--glass-bg)' : 'rgba(0,0,0,0.05)';
                  const apptId = e.dataTransfer.getData("appointmentId");
                  if (apptId) {
                    const originalAppt = airesAppts.find(a => a.id === apptId);
                    const effectiveType = originalAppt ? resolveTestType(originalAppt) : null;
                    if (isCurvaFull && isCurvaType(effectiveType)) { 
                      alert("Límite de turnos de CURVAS PAB alcanzado para este Jueves (Máx 3)."); 
                      return; 
                    }
                    let targetDateTime = day.toISOString();
                    if (originalAppt && originalAppt.appointment_date) {
                      const originalDate = new Date(originalAppt.appointment_date);
                      const newDateWithTime = new Date(day);
                      newDateWithTime.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
                      targetDateTime = format(newDateWithTime, "yyyy-MM-dd'T'HH:mm:ssxxx");
                    }
                    setMovingAppt({ id: apptId, targetDate: targetDateTime });
                    setIsMovingModalOpen(true);
                  }
                }}
                style={{
                  background: isBlocked
                    ? 'rgba(239,68,68,0.1)'
                    : (isCurrentMonth ? (isCurvaFull ? 'rgba(239,68,68,0.02)' : 'var(--glass-bg)') : 'rgba(0,0,0,0.05)'),
                  border: isBlocked
                    ? '2px solid rgba(239,68,68,0.45)'
                    : (isCurvaFull ? '2px dashed rgba(239,68,68,0.3)' : (isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)')),
                  borderRadius: '8px',
                  cursor: isBlocked ? 'not-allowed' : 'pointer',
                  padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem',
                  minHeight: '120px',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  transition: 'all 0.2s ease',
                }}
                className={isCurrentMonth && !isBlocked ? "hoverable-day" : ""}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0, color: isBlocked ? '#EF4444' : (isToday ? 'var(--primary)' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)')) }}>
                    {format(day, 'dd', { locale: es })}
                  </p>
                  {isBlocked ? (
                    <Ban size={14} color="#EF4444" />
                  ) : (
                    isThursday ? (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700,
                        background: isCurvaFull ? 'var(--danger)' : (curvaCount > 0 ? '#F59E0B' : 'rgba(0,0,0,0.05)'),
                        color: curvaCount > 0 ? 'white' : 'var(--text-muted)',
                        padding: '0.1rem 0.3rem', borderRadius: '4px',
                      }}>
                        CURVAS PAB {curvaCount}/3
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700,
                        background: 'rgba(0,0,0,0.05)',
                        color: 'var(--text-muted)',
                        padding: '0.1rem 0.3rem', borderRadius: '4px',
                      }}>
                        {activeDayAppts.length}
                      </span>
                    )
                  )}
                </div>

                {isBlocked ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', padding: '0.25rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#EF4444', textAlign: 'center', letterSpacing: '0.03em' }}>SIN ATENCIÓN</span>
                    {blocked.descripcion && (
                      <span style={{ fontSize: '0.63rem', color: 'rgba(239,68,68,0.75)', textAlign: 'center', lineHeight: 1.3 }}>
                        {blocked.descripcion}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, maxHeight: '280px' }}>
                    {dayAppts.filter(Boolean).map(apt => {
                      const effectiveType = resolveTestType(apt);
                      return (
                      <div key={apt.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData("appointmentId", apt.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        style={{
                          ...getTypeStyle(effectiveType, apt.status),
                          padding: '0.65rem',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                          position: 'relative',
                          borderLeft: apt?.status === 'COMPLETADO' ? '5px solid var(--success)' : `5px solid ${getBadgeColor(effectiveType)}`,
                          cursor: 'grab',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          minHeight: 'fit-content',
                        }}
                        onClick={(e) => { e.stopPropagation(); setSelectedAp(apt); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: getBadgeColor(effectiveType), fontWeight: 800, fontSize: '0.75rem' }}>
                            <Clock size={11} />
                            {format(new Date(apt?.appointment_date || new Date()), "HH:mm")}
                            {apt?.status === 'COMPLETADO' && <CheckCircle size={11} color="var(--success)" />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {loadingId === apt.id ? (
                              <Loader2 size={11} className="animate-spin" color="var(--primary)" />
                            ) : (
                              <input
                                type="checkbox"
                                title="Indicaciones Enviadas"
                                checked={apt.indications_sent || false}
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  const newStatus = e.target.checked;
                                  setLoadingId(apt.id);
                                  try {
                                    const res = await toggleIndicationsStatus(apt.id, newStatus);
                                    if (res.success) { router.refresh(); } else { alert(res.error); }
                                  } catch { alert("Error al actualizar indicaciones"); }
                                  finally { setLoadingId(null); }
                                }}
                                style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--primary)', margin: 0 }}
                              />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedAp(apt); }}
                              style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '1px' }}
                            >
                              <Edit2 size={10} />
                            </button>
                          </div>
                        </div>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.15, color: apt?.status === 'CANCELADO' ? 'var(--text-muted)' : 'var(--text-main)', margin: '0.1rem 0', textDecoration: apt?.status === 'CANCELADO' ? 'line-through' : 'none', opacity: apt?.status === 'CANCELADO' ? 0.6 : 1, wordBreak: 'break-word' }}>{apt?.name}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.05rem' }}>
                          <p style={{ fontSize: '0.75rem', color: getBadgeColor(effectiveType), fontWeight: 700, margin: 0 }}>
                             {formatPabDisplayType(apt)}
                           </p>
                           {apt.observations && <MessageSquare size={10} color="var(--primary)" />}
                         </div>
                       </div>
                      );
                    })}
                    {isCurvaFull && (
                      <div style={{ marginTop: 'auto', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 800 }}>
                        <AlertCircle size={10} /> CUPO CURVAS PAB JUEVES AGOTADO
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AppointmentModal
        key={selectedDate ? selectedDate.toISOString() : "new"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDate={selectedDate}
        isPab={true}
      />

      <EditAppointmentModal
        isOpen={selectedAp !== null}
        onClose={() => setSelectedAp(null)}
        ap={selectedAp}
        isPab={true}
      />

      <EvolutionModal
        isOpen={selectedApForEvolution !== null}
        onClose={() => setSelectedApForEvolution(null)}
        ap={selectedApForEvolution}
      />

      <MoveReasonModal
        isOpen={isMovingModalOpen}
        onClose={() => { setIsMovingModalOpen(false); setMovingAppt(null); }}
        apptId={movingAppt?.id || null}
        newDate={movingAppt?.targetDate || null}
      />

      <style jsx>{`
        .hoverable-day:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border-color: var(--primary);
          z-index: 10;
        }
        .stat-card { transition: transform 0.2s ease; }
        .stat-card:hover { transform: scale(1.05); }
      `}</style>
    </div>
  );
}
