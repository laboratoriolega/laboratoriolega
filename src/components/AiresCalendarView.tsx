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

  // Filter ONLY Aires appointments
  const airesAppts = appointments.filter(a => a.analysis_type === 'Aires');

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wind size={28} color="var(--primary)" /> Agenda de Aires (SIBO/Lactosa)
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Límite máximo: 4 turnos por día.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, minWidth: '180px', textAlign: 'center', fontSize: '1.25rem' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', border: 'none', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', flex: 1 }}>
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
           <div key={d} style={{ fontWeight: 700, textAlign: 'center', paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{d}</div>
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
                   alert("Límite de turnos alcanzado para este día.");
                   return;
                 }
                 setSelectedDate(day);
                 setIsModalOpen(true);
              }}
              style={{ 
                background: isCurrentMonth ? (isFull ? '#fff1f2' : '#FFFFFF') : 'rgba(0,0,0,0.02)',
                border: isFull ? '2px dashed #fb7185' : (isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)'), 
                borderRadius: '12px', 
                cursor: isFull ? 'not-allowed' : 'pointer',
                padding: '0.6rem',
                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                minHeight: '130px', opacity: isCurrentMonth ? 1 : 0.4,
                transition: 'all 0.2s ease',
                boxShadow: isToday ? '0 4px 12px rgba(14, 165, 233, 0.15)' : 'none'
              }}
              className={!isFull ? "hoverable-day" : ""}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <p style={{ fontWeight: 800, fontSize: '0.9rem', color: isToday ? 'var(--primary)' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)') }}>
                   {format(day, 'dd', { locale: es })}
                 </p>
                 <span style={{ 
                   fontSize: '0.7rem', fontWeight: 800, 
                   background: isFull ? '#e11d48' : (dayAppts.length > 0 ? '#0ea5e9' : 'transparent'),
                   color: dayAppts.length > 0 ? 'white' : '#94a3b8',
                   padding: '0.1rem 0.4rem', borderRadius: '4px'
                 }}>
                   {dayAppts.length}/4
                 </span>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
                 {dayAppts.map(apt => (
                    <div key={apt.id} style={{ 
                      background: 'white', 
                      border: '1px solid #e2e8f0', 
                      padding: '0.4rem', 
                      borderRadius: '6px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAp(apt);
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.65rem', marginBottom: '0.1rem' }}>
                        <Clock size={10} />
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </div>
                      <p style={{ fontWeight: 700, fontSize: '0.7rem', lineHeight: 1.1, color: '#1e293b' }}>{apt.name}</p>
                      <p style={{ fontSize: '0.6rem', color: '#64748b' }}>{apt.aire_test_type || 'Aire'}</p>
                    </div>
                  ))}
                  {isFull && <div style={{ marginTop: 'auto', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 700 }}> <AlertCircle size={10} /> DÍA COMPLETO </div>}
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
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
