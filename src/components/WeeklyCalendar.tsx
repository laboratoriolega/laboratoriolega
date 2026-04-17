"use client";

import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function WeeklyCalendar({ appointments }: { appointments: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Comienza el lunes
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Vista de Calendario Semanal</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}
          >
             <ChevronLeft size={20} />
          </button>
          <span style={{ fontWeight: 600, minWidth: '150px', textAlign: 'center' }}>
            {format(startDate, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button 
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}
          >
             <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', minHeight: '400px' }}>
        {weekDays.map(day => {
          const dayAppts = appointments?.filter(a => isSameDay(new Date(a.appointment_date), day)) || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} style={{ 
              background: isToday ? 'rgba(14, 165, 233, 0.05)' : '#FFFFFF',
              border: isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {format(day, 'EEEE', { locale: es })}
                </p>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: isToday ? 'var(--primary)' : 'inherit' }}>
                  {format(day, 'dd')}
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {dayAppts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>Sin turnos</p>
                ) : (
                  dayAppts.map(apt => (
                    <div key={apt.id} style={{ 
                      background: 'rgba(0,0,0,0.02)', 
                      border: '1px solid var(--glass-border)', 
                      padding: '0.75rem', 
                      borderRadius: '8px',
                      borderLeft: `4px solid ${apt.status === 'AGENDADO' ? 'var(--primary)' : 'var(--success)'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        <Clock size={14} />
                        {format(new Date(apt.appointment_date), "HH:mm")} hs
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{apt.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.analysis_type}</p>
                      <span style={{ 
                        display: 'inline-block',
                        background: 'rgba(0,0,0,0.05)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.7rem', 
                        marginTop: '0.4rem',
                        fontWeight: 500
                      }}>
                        {apt.health_insurance}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
