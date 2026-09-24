"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight, Wind, AlertCircle, Edit2, CheckCircle, MessageSquare, Loader2, Ban } from "lucide-react";
import { toggleIndicationsStatus } from "@/actions/appointments";
import BlockedDaysPanel from "./BlockedDaysPanel";
import { useRouter } from "next/navigation";
import AppointmentModal from "./AppointmentModal";
import EditAppointmentModal from "./EditAppointmentModal";
import EvolutionModal from "./EvolutionModal";
import MoveReasonModal from "./MoveReasonModal";

type BlockedDay = { id: number; fecha: string; descripcion: string | null };

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

  useEffect(() => { setBlockedDays(initialBlockedDays); }, [initialBlockedDays]);

  if (!appointments) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysGrid: Date[] = [];
  let day = startDate;
  while (day <= endDate) { daysGrid.push(day); day = addDays(day, 1); }

  const pabTestNames = ['CURVA', 'EXTRACCIÓN - ENDOCRINOLOGÍA'];
  const airesAppts = (appointments || []).filter(a =>
    a &&
    (pabTestNames.includes((a.analysis_type || '').toUpperCase()) || 
     (a.aire_test_type && pabTestNames.includes(a.aire_test_type.toUpperCase())) || 
     (a.analyses && a.analyses.some((ana: any) => pabTestNames.includes((ana.name || '').toUpperCase())))) &&
    !a.is_domicilio
  );

  const currentMonthAppts = airesAppts.filter(a => a && a.appointment_date && isSameMonth(new Date(a.appointment_date), monthStart));
  const completedThisMonth = currentMonthAppts.filter(a => a?.status === 'COMPLETADO').length;
  const curvaTotal = currentMonthAppts.filter(a => resolveTestType(a)?.toUpperCase() === 'CURVA').length;
  const curvaCompleted = currentMonthAppts.filter(a => resolveTestType(a)?.toUpperCase() === 'CURVA' && a?.status === 'COMPLETADO').length;
  const extraccionTotal = currentMonthAppts.filter(a => resolveTestType(a)?.toUpperCase() === 'EXTRACCIÓN - ENDOCRINOLOGÍA').length;
  const extraccionCompleted = currentMonthAppts.filter(a => resolveTestType(a)?.toUpperCase() === 'EXTRACCIÓN - ENDOCRINOLOGÍA' && a?.status === 'COMPLETADO').length;

  function getBlockedInfo(d: Date): BlockedDay | null {
    const key = format(d, 'yyyy-MM-dd');
    return blockedDays.find(b => b.fecha.slice(0, 10) === key) || null;
  }

  // Resolve the effective aire test type from multiple possible sources
  const resolveTestType = (apt: any): string | undefined => {
    if (apt.aire_test_type) return apt.aire_test_type;
    // Fall back to analyses array subtype or name
    if (apt.analyses && apt.analyses.length > 0) {
      const pabTestNames = ['CURVA', 'EXTRACCIÓN - ENDOCRINOLOGÍA'];
      const airAnalysis = apt.analyses.find((a: any) => 
        pabTestNames.includes((a.subtype || '').toUpperCase()) || 
        pabTestNames.includes((a.name || '').toUpperCase())
      );
      if (airAnalysis) return airAnalysis.subtype || airAnalysis.name;
    }
    return apt.analysis_type;
  };

  const getTypeStyle = (type?: string, status?: string) => {
    let base = { border: '1px solid var(--glass-border)', borderLeft: '5px solid var(--glass-border)', background: 'var(--glass-bg)', opacity: 1 };
    if (status === 'CANCELADO') return { ...base, opacity: 0.5, background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderLeft: '5px solid #94a3b8' };
    const t = (type || '').toUpperCase();
    if (t === 'CURVA') {
      base = { ...base, border: '1px solid #10B981', borderLeft: '5px solid #10B981', background: status === 'COMPLETADO' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)' };
    } else if (t === 'EXTRACCIÓN - ENDOCRINOLOGÍA') {
      base = { ...base, border: '1px solid #8B5CF6', borderLeft: '5px solid #8B5CF6', background: status === 'COMPLETADO' ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' };
    }
    if (status === 'COMPLETADO') { base.border = '1px solid var(--success)'; base.borderLeft = '5px solid var(--success)'; }
    return base;
  };

  const getBadgeColor = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'CURVA') return '#10B981';
    if (t === 'EXTRACCIÓN - ENDOCRINOLOGÍA') return '#8B5CF6';
    return 'var(--primary)';
  };

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

      {showBlockedPanel && <BlockedDaysPanel blockedDays={blockedDays} />}

      <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }}></span> CURVA ({curvaTotal}/{curvaCompleted})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#8B5CF6' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8B5CF6' }}></span> EXTRACCIÓN - ENDOCRINOLOGÍA ({extraccionTotal}/{extraccionCompleted})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#EF4444' }}>
          <Ban size={12} color="#EF4444" /> SIN ATENCIÓN
        </div>
      </div>

      <div style={{ overflowX: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', minWidth: '800px', paddingBottom: '1rem' }}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
            <div key={d} style={{ fontWeight: 600, textAlign: 'center', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>{d}</div>
          ))}

          {daysGrid.map(day => {
            const dayAppts = (airesAppts || []).filter(a => a && a.appointment_date && isSameDay(new Date(a.appointment_date), day));
            const activeDayAppts = dayAppts.filter(a => a.status !== 'CANCELADO');
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const isFull = activeDayAppts.length >= 3;
            const blocked = getBlockedInfo(day);
            const isBlocked = blocked !== null;

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  if (isBlocked) return;
                  if (isFull) { alert("Límite de turnos alcanzado para este día (Máx 3)."); return; }
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
                    if (isFull) { alert("No se pueden mover turnos a este día: Límite de 3 alcanzado."); return; }
                    const originalAppt = airesAppts.find(a => a.id === apptId);
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
                    : (isCurrentMonth ? (isFull ? 'rgba(239,68,68,0.05)' : 'var(--glass-bg)') : 'rgba(0,0,0,0.05)'),
                  border: isBlocked
                    ? '2px solid rgba(239,68,68,0.45)'
                    : (isFull ? '2px dashed var(--danger)' : (isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)')),
                  borderRadius: '8px',
                  cursor: (isBlocked || isFull) ? 'not-allowed' : 'pointer',
                  padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem',
                  minHeight: '120px',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  transition: 'all 0.2s ease',
                }}
                className={!isFull && isCurrentMonth && !isBlocked ? "hoverable-day" : ""}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0, color: isBlocked ? '#EF4444' : (isToday ? 'var(--primary)' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)')) }}>
                    {format(day, 'dd', { locale: es })}
                  </p>
                  {isBlocked ? (
                    <Ban size={14} color="#EF4444" />
                  ) : (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      background: isFull ? 'var(--danger)' : (activeDayAppts.length > 0 ? 'var(--primary)' : 'rgba(0,0,0,0.1)'),
                      color: activeDayAppts.length > 0 ? 'white' : 'var(--text-muted)',
                      padding: '0.1rem 0.4rem', borderRadius: '4px',
                    }}>
                      {activeDayAppts.length}/3
                    </span>
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
                          background: apt?.status === 'COMPLETADO' ? 'rgba(16,185,129,0.12)' : undefined,
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
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>
                             {effectiveType || (apt.analyses && apt.analyses.length > 0 ? apt.analyses[0].name : 'Prueba')}
                           </p>
                           {apt.observations && <MessageSquare size={10} color="var(--primary)" />}
                         </div>
                       </div>
                      );
                    })}
                    {isFull && (
                      <div style={{ marginTop: 'auto', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 800 }}>
                        <AlertCircle size={10} /> CUPO AGOTADO
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
