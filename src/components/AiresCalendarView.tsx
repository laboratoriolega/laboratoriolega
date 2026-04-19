"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight, Wind, AlertCircle } from "lucide-react";
import AppointmentModal from "./AppointmentModal";
import EditAppointmentModal from "./EditAppointmentModal";

export default function AiresCalendarView({ appointments }: { appointments: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAp, setSelectedAp] = useState<any>(null);

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
  const airesAppts = appointments.filter(a => a.analysis_type === 'Test de aire');
  
  // Stats
  const totalGeneral = airesAppts.length;
  const currentMonthAppts = airesAppts.filter(a => isSameMonth(new Date(a.appointment_date), monthStart));
  const completedThisMonth = currentMonthAppts.filter(a => a.status === 'COMPLETADO').length;
  const remainingThisMonth = currentMonthAppts.length - completedThisMonth;

  const getTypeStyle = (type?: string) => {
    switch(type) {
      case 'SIBO': return { border: '1px solid #A855F7', borderLeft: '5px solid #A855F7', background: '#faf5ff' };
      case 'Lactosa': return { border: '1px solid #EC4899', borderLeft: '5px solid #EC4899', background: '#fdf2f8' };
      case 'Fructuosa': return { border: '1px solid #78350F', borderLeft: '5px solid #78350F', background: '#fff7ed' };
      default: return { border: '1px solid #e2e8f0', borderLeft: '5px solid #e2e8f0', background: 'white' };
    }
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
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginTop: '0.25rem' }}>Gestión especializada de pruebas respiratorias.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total General</p>
              <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{totalGeneral}</h4>
           </div>
           <div className="stat-card" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Cargados Mes</p>
              <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{currentMonthAppts.length}</h4>
           </div>
           <div className="stat-card" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0', minWidth: '120px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Completados</p>
              <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{completedThisMonth}</h4>
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#A855F7' }}></span> SIBO (Violeta)
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EC4899' }}></span> LACTOSA (Rosa)
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#78350F' }}></span> FRUCTUOSA (Marrón)
           </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 800, minWidth: '180px', textAlign: 'center', fontSize: '1.1rem', color: '#1e293b' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', flex: 1 }}>
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
           <div key={d} style={{ fontWeight: 800, textAlign: 'center', paddingBottom: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
        ))}
        
        {daysGrid.map(day => {
          const dayAppts = airesAppts.filter(a => isSameDay(new Date(a.appointment_date), day));
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
                 {dayAppts.map(apt => (
                    <div key={apt.id} style={{ 
                      ...getTypeStyle(apt.aire_test_type),
                      padding: '0.5rem', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAp(apt);
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: getBadgeColor(apt.aire_test_type), fontWeight: 800, fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                        <Clock size={10} />
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </div>
                      <p style={{ fontWeight: 800, fontSize: '0.75rem', lineHeight: 1.2, color: '#1e293b', margin: 0 }}>{apt.name}</p>
                      <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.1rem', fontWeight: 600 }}>{apt.aire_test_type || 'Prueba'}</p>
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
