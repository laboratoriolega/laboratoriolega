"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight, Wind, AlertCircle, Edit2, CheckCircle, MessageSquare } from "lucide-react";
import AppointmentModal from "./AppointmentModal";
import EditAppointmentModal from "./EditAppointmentModal";
import EvolutionModal from "./EvolutionModal";
import MoveReasonModal from "./MoveReasonModal";

export default function AiresCalendarView({ appointments }: { appointments: any[] }) {
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
  
  const siboCount = currentMonthAppts.filter(a => a?.aire_test_type === 'SIBO').length;
  const lactosaCount = currentMonthAppts.filter(a => a?.aire_test_type === 'Lactosa').length;
  const fructuosaCount = currentMonthAppts.filter(a => a?.aire_test_type === 'Fructuosa').length;

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
      case 'Lactosa': return '#EC4899';
      case 'Fructuosa': return '#78350F';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      
      {/* Stats and Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Wind size={32} color="var(--primary)" /> Turnos de Aire
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: '0.25rem' }}>Estadísticas y carga mensual especializada.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>            
            <div className="stat-card" style={{ background: 'var(--glass-bg)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', minWidth: '110px' }}>
               <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cargados Mes</p>
               <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{currentMonthAppts.length}</h4>
            </div>
            
            <div className="stat-card" style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)', minWidth: '90px' }}>
               <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase' }}>SIBO</p>
               <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#A855F7' }}>{siboCount}</h4>
            </div>
            
            <div className="stat-card" style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.3)', minWidth: '90px' }}>
               <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#EC4899', textTransform: 'uppercase' }}>Lactosa</p>
               <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#EC4899' }}>{lactosaCount}</h4>
            </div>
            
            <div className="stat-card" style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.3)', minWidth: '90px' }}>
               <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#F97316', textTransform: 'uppercase' }}>Fructuosa</p>
               <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#F97316' }}>{fructuosaCount}</h4>
            </div>

            <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', minWidth: '110px' }}>
               <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Completados</p>
               <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{completedThisMonth}</h4>
            </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#A855F7' }}>
               <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#A855F7' }}></span> SIBO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#EC4899' }}>
               <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EC4899' }}></span> LACTOSA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#F97316' }}>
               <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F97316' }}></span> FRUCTUOSA
            </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 800, minWidth: '180px', textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-main)' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', flex: 1 }}>
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
           <div key={d} style={{ fontWeight: 800, textAlign: 'center', paddingBottom: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
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
                  setMovingAppt({ id: apptId, targetDate: day.toISOString() });
                  setIsMovingModalOpen(true);
                }
              }}
              style={{ 
                background: isCurrentMonth ? (isFull ? '#fff1f2' : '#FFFFFF') : 'rgba(0,0,0,0.02)',
                border: isFull ? '2px dashed #fb7185' : (isToday ? '2px solid var(--primary)' : '1px solid #e2e8f0'), 
                borderRadius: '16px', 
                cursor: isFull ? 'not-allowed' : 'pointer',
                padding: '0.75rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                minHeight: '140px', opacity: isCurrentMonth ? 1 : 0.3,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isToday ? '0 10px 15px -3px rgba(14, 165, 233, 0.2)' : '0 1px 3px rgba(0,0,0,0.02)'
              }}
              className={!isFull && isCurrentMonth ? "hoverable-day" : ""}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <p style={{ fontWeight: 900, fontSize: '1rem', margin: 0, color: isToday ? 'var(--primary)' : (isCurrentMonth ? '#1e293b' : '#94a3b8') }}>
                   {format(day, 'd', { locale: es })}
                 </p>
                 <span style={{ 
                   fontSize: '0.65rem', fontWeight: 900, 
                   background: isFull ? '#e11d48' : (dayAppts.length > 0 ? 'var(--primary)' : '#f1f5f9'),
                   color: dayAppts.length > 0 ? 'white' : '#94a3b8',
                   padding: '0.2rem 0.5rem', borderRadius: '6px'
                 }}>
                   {dayAppts.length}/4
                 </span>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1, maxHeight: '220px' }}>
                 {dayAppts.filter(Boolean).map(apt => (
                    <div key={apt.id} style={{ 
                      ...getTypeStyle(apt.aire_test_type, apt.status),
                      padding: '0.5rem', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'grab'
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("appointmentId", apt.id);
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApForEvolution(apt);
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: getBadgeColor(apt?.analysis_type), fontWeight: 800, fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                          <Clock size={10} />
                          {format(new Date(apt?.appointment_date || new Date()), "HH:mm")}
                          {apt?.status === 'COMPLETADO' && <CheckCircle size={10} color="var(--success)" />}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAp(apt);
                          }}
                          style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                        >
                          <Edit2 size={10} />
                        </button>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: '0.75rem', lineHeight: 1.2, color: apt?.status === 'CANCELADO' ? '#64748b' : '#1e293b', margin: 0, textDecoration: apt?.status === 'CANCELADO' ? 'line-through' : 'none' }}>{apt?.name}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.1rem' }}>
                        <p style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>{apt.aire_test_type || 'Prueba'}</p>
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
