"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight, Wind, AlertCircle, Edit2, CheckCircle, MessageSquare, Loader2 } from "lucide-react";
import { toggleIndicationsStatus } from "@/actions/appointments";
import { useRouter } from "next/navigation";
import AppointmentModal from "./AppointmentModal";
import EditAppointmentModal from "./EditAppointmentModal";
import EvolutionModal from "./EvolutionModal";
import MoveReasonModal from "./MoveReasonModal";

export default function AiresCalendarView({ appointments }: { appointments: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAp, setSelectedAp] = useState<any>(null);
  const [selectedApForEvolution, setSelectedApForEvolution] = useState<any>(null);
  const [isMovingModalOpen, setIsMovingModalOpen] = useState(false);
  const [movingAppt, setMovingAppt] = useState<{ id: string, targetDate: string } | null>(null);

  if (!appointments) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysGrid = [];
  let day = startDate;
  while (day <= endDate) {
    daysGrid.push(day);
    day = addDays(day, 1);
  }

  // Filter ONLY Test de aire appointments
  const airesAppts = (appointments || []).filter(a => a && a.analysis_type === 'Test de aire');
  
  // Stats for the current month view
  const currentMonthAppts = airesAppts.filter(a => a && a.appointment_date && isSameMonth(new Date(a.appointment_date), monthStart));
  const completedThisMonth = currentMonthAppts.filter(a => a?.status === 'COMPLETADO').length;
  
  const siboTotal = currentMonthAppts.filter(a => a?.aire_test_type === 'SIBO').length;
  const siboCompleted = currentMonthAppts.filter(a => a?.aire_test_type === 'SIBO' && a?.status === 'COMPLETADO').length;

  const siboLactulonTotal = currentMonthAppts.filter(a => a?.aire_test_type === 'SIBO c/Lactulon').length;
  const siboLactulonCompleted = currentMonthAppts.filter(a => a?.aire_test_type === 'SIBO c/Lactulon' && a?.status === 'COMPLETADO').length;

  const lactosaTotal = currentMonthAppts.filter(a => a?.aire_test_type === 'Lactosa').length;
  const lactosaCompleted = currentMonthAppts.filter(a => a?.aire_test_type === 'Lactosa' && a?.status === 'COMPLETADO').length;

  const fructuosaTotal = currentMonthAppts.filter(a => a?.aire_test_type === 'Fructuosa').length;
  const fructuosaCompleted = currentMonthAppts.filter(a => a?.aire_test_type === 'Fructuosa' && a?.status === 'COMPLETADO').length;

  const getTypeStyle = (type?: string, status?: string) => {
    let base = { 
      border: '1px solid var(--glass-border)', 
      borderLeft: '5px solid var(--glass-border)', 
      background: 'var(--glass-bg)', 
      opacity: 1 
    };
    
    if (status === 'CANCELADO') {
      return { ...base, opacity: 0.5, background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderLeft: '5px solid #94a3b8' };
    }

    switch(type) {
      case 'SIBO': base = { ...base, border: '1px solid #A855F7', borderLeft: '5px solid #A855F7', background: status === 'COMPLETADO' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)' }; break;
      case 'SIBO c/Lactulon': base = { ...base, border: '1px solid #06B6D4', borderLeft: '5px solid #06B6D4', background: status === 'COMPLETADO' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.05)' }; break;
      case 'Lactosa': base = { ...base, border: '1px solid #EC4899', borderLeft: '5px solid #EC4899', background: status === 'COMPLETADO' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)' }; break;
      case 'Fructuosa': base = { ...base, border: '1px solid #F97316', borderLeft: '5px solid #F97316', background: status === 'COMPLETADO' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)' }; break;
    }
    
    if (status === 'COMPLETADO') {
      base.border = '1px solid var(--success)';
      base.borderLeft = '5px solid var(--success)';
    }

    return base;
  };

  const getBadgeColor = (type?: string) => {
    switch(type) {
      case 'SIBO': return '#A855F7';
      case 'SIBO c/Lactulon': return '#06B6D4';
      case 'Lactosa': return '#EC4899';
      case 'Fructuosa': return '#78350F';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ minWidth: '200px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wind size={24} color="var(--primary)" /> Turnos de Aire
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{currentMonthAppts.length} turnos este mes ({completedThisMonth} completados)</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 800, minWidth: '180px', textAlign: 'center', fontSize: '1.25rem', color: 'var(--text-main)' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#A855F7' }}>
             <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#A855F7' }}></span> SIBO ({siboTotal}/{siboCompleted})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#06B6D4' }}>
             <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#06B6D4' }}></span> SIBO C/ LACTULON ({siboLactulonTotal}/{siboLactulonCompleted})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#EC4899' }}>
             <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EC4899' }}></span> LACTOSA ({lactosaTotal}/{lactosaCompleted})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#F97316' }}>
             <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F97316' }}></span> FRUCTUOSA ({fructuosaTotal}/{fructuosaCompleted})
          </div>
      </div>


      <div style={{ overflowX: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', minWidth: '800px', paddingBottom: '1rem' }}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
             <div key={d} style={{ fontWeight: 600, textAlign: 'center', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>{d}</div>
          ))}
        
        {daysGrid.map(day => {
          const dayAppts = (airesAppts || []).filter(a => a && a.appointment_date && isSameDay(new Date(a.appointment_date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isFull = dayAppts.length >= 4;

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => {
                 if (isFull) {
                   alert("Límite de turnos alcanzado para este día (Máx 4).");
                   return;
                 }
                 setSelectedDate(day);
                 setIsModalOpen(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.background = isCurrentMonth ? 'var(--glass-bg)' : 'rgba(0,0,0,0.05)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.background = isCurrentMonth ? 'var(--glass-bg)' : 'rgba(0,0,0,0.05)';
                const apptId = e.dataTransfer.getData("appointmentId");
                if (apptId) {
                  if (isFull) {
                    alert("No se pueden mover turnos a este día: Límite de 4 alcanzado.");
                    return;
                  }
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
                background: isCurrentMonth ? (isFull ? 'rgba(239, 68, 68, 0.05)' : 'var(--glass-bg)') : 'rgba(0,0,0,0.05)',
                border: isFull ? '2px dashed var(--danger)' : (isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)'), 
                borderRadius: '8px', 
                cursor: isFull ? 'not-allowed' : 'pointer',
                padding: '0.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.25rem',
                minHeight: '120px', opacity: isCurrentMonth ? 1 : 0.4,
                transition: 'all 0.2s ease'
              }}
              className={!isFull && isCurrentMonth ? "hoverable-day" : ""}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                 <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0, color: isToday ? 'var(--primary)' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)') }}>
                    {format(day, 'dd', { locale: es })}
                 </p>
                 <span style={{ 
                    fontSize: '0.65rem', fontWeight: 700, 
                    background: isFull ? 'var(--danger)' : (dayAppts.length > 0 ? 'var(--primary)' : 'rgba(0,0,0,0.1)'),
                    color: dayAppts.length > 0 ? 'white' : 'var(--text-muted)',
                    padding: '0.1rem 0.4rem', borderRadius: '4px'
                 }}>
                    {dayAppts.length}/4
                 </span>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, maxHeight: '280px' }}>
                 {dayAppts.filter(Boolean).map(apt => (
                     <div key={apt.id} style={{ 
                       ...getTypeStyle(apt.aire_test_type, apt.status),
                       padding: '0.65rem', 
                       borderRadius: '8px',
                       boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                       position: 'relative',
                       border: '1px solid var(--glass-border)',
                       borderLeft: `5px solid ${getBadgeColor(apt?.analysis_type)}`,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       flexShrink: 0,
                       minHeight: 'fit-content'
                     }}
                     onClick={() => {
                       setSelectedAp(apt);
                     }}
                     >
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: getBadgeColor(apt?.analysis_type), fontWeight: 800, fontSize: '0.75rem' }}>
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
                                   if (res.success) {
                                     router.refresh();
                                   } else {
                                     alert(res.error);
                                   }
                                 } catch (err) {
                                   alert("Error al actualizar indicaciones");
                                 } finally {
                                   setLoadingId(null);
                                 }
                               }}
                               style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--primary)', margin: 0 }}
                             />
                           )}
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedAp(apt);
                             }}
                             style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '1px' }}
                           >
                             <Edit2 size={10} />
                           </button>
                         </div>
                       </div>
                       <p style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.15, color: apt?.status === 'CANCELADO' ? 'var(--text-muted)' : 'var(--text-main)', margin: '0.1rem 0', textDecoration: apt?.status === 'CANCELADO' ? 'line-through' : 'none', opacity: apt?.status === 'CANCELADO' ? 0.6 : 1, wordBreak: 'break-word' }}>{apt?.name}</p>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.05rem' }}>
                         <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>{apt.aire_test_type || 'Prueba'}</p>
                         {apt.observations && <MessageSquare size={10} color="var(--primary)" />}
                       </div>
                     </div>
                  ))}
                  {isFull && <div style={{ marginTop: 'auto', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 800 }}> <AlertCircle size={10} /> CUPO AGOTADO </div>}
               </div>
            </div>
          );
        })}
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultDate={selectedDate} 
      />

      <EditAppointmentModal
        isOpen={selectedAp !== null}
        onClose={() => setSelectedAp(null)}
        ap={selectedAp}
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
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: var(--primary);
          z-index: 10;
        }
        .stat-card { transition: transform 0.2s ease; }
        .stat-card:hover { transform: scale(1.05); }
      `}</style>
    </div>
  );
}
