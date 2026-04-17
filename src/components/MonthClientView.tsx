"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthClientView({ appointments }: { appointments: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Empezar el grid siempre desde el lunes correspondiente a la primer semana del mes
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysGrid = [];
  let day = startDate;
  while (day <= endDate) {
    daysGrid.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Agenda del Mes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}
          >
             <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: 600, minWidth: '180px', textAlign: 'center', fontSize: '1.25rem' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}
          >
             <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', flex: 1 }}>
        {/* Cabecera de días de Lunes a Domingo */}
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
           <div key={d} style={{ fontWeight: 600, textAlign: 'center', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>{d}</div>
        ))}
        
        {/* Grid de días */}
        {daysGrid.map(day => {
          const dayAppts = appointments.filter(a => isSameDay(new Date(a.appointment_date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} style={{ 
              background: isCurrentMonth ? '#FFFFFF' : 'rgba(0,0,0,0.02)',
              border: isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)', 
              borderRadius: '8px', 
              padding: '0.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
              minHeight: '120px', opacity: isCurrentMonth ? 1 : 0.6
            }}>
               <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem', color: isToday ? 'var(--primary)' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)') }}>
                 {format(day, 'dd', { locale: es })}
               </p>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
                 {dayAppts.map(apt => (
                    <div key={apt.id} style={{ 
                      background: 'rgba(0,0,0,0.02)', 
                      border: '1px solid var(--glass-border)', 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      borderLeft: `3px solid ${apt.status === 'AGENDADO' ? 'var(--primary)' : 'var(--success)'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', marginBottom: '0.1rem', fontWeight: 600, fontSize: '0.7rem' }}>
                        <Clock size={10} />
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.1, marginBottom: '0.1rem' }}>{apt.name}</p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{apt.analysis_type}</p>
                      <p style={{ fontSize: '0.65rem', fontWeight: 500 }}>{apt.health_insurance}</p>
                    </div>
                  ))}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
