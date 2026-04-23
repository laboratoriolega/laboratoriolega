"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import AppointmentModal from "./AppointmentModal";
import EvolutionModal from "./EvolutionModal";
import EditAppointmentModal from "./EditAppointmentModal";
import MoveReasonModal from "./MoveReasonModal";
import { Clock, ChevronLeft, ChevronRight, Edit2, MessageSquare, Car, MapPin, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import { toggleIndicationsStatus } from "@/actions/appointments";
import { useRouter } from "next/navigation";

export default function DomicilioCalendarView({ appointments }: { appointments: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAp, setSelectedAp] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAp, setEditingAp] = useState<any>(null);
  
  const [isMovingModalOpen, setIsMovingModalOpen] = useState(false);
  const [movingAppt, setMovingAppt] = useState<{ id: string, targetDate: string } | null>(null);

  if (!appointments) return null;

  // ONLY Domicilio appointments
  const filteredAppointments = (appointments || []).filter(a => a && a.is_domicilio);

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

  return (
    <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Car size={24} color="var(--primary)" /> Agenda Domicilios
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 800, minWidth: '180px', textAlign: 'center', fontSize: '1.25rem', color: 'var(--text-main)' }}>
            {format(monthStart, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minWidth: '800px', paddingBottom: '1rem' }}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
             <div key={d} style={{ fontWeight: 600, textAlign: 'center', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>{d}</div>
          ))}
        
        {daysGrid.map(day => {
          const dayAppts = (filteredAppointments || []).filter(a => a && a.appointment_date && isSameDay(new Date(a.appointment_date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => {
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
                  const originalAppt = filteredAppointments.find(a => a.id === apptId);
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
              background: isCurrentMonth ? 'var(--glass-bg)' : 'rgba(0,0,0,0.05)',
              border: isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)', 
              borderRadius: '8px', 
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
              minHeight: '120px', opacity: isCurrentMonth ? 1 : 0.4
            }}
            onMouseEnter={(e) => e.currentTarget.style.border = '2px solid var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.border = isToday ? '2px solid var(--primary)' : '1px solid var(--glass-border)'}
            >
               <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem', color: isToday ? 'var(--primary)' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)') }}>
                 {format(day, 'dd', { locale: es })}
               </p>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1, maxHeight: '250px' }}>
                 {dayAppts.filter(Boolean).map(apt => (
                    <div key={apt.id} 
                      style={{ 
                        background: 'rgba(14, 165, 233, 0.05)', 
                        border: '1px solid rgba(14, 165, 233, 0.2)', 
                        padding: '0.65rem', 
                        borderRadius: '4px',
                        borderLeft: `3px solid ${apt?.status === 'AGENDADO' ? 'var(--primary)' : (apt?.status === 'CANCELADO' ? '#94a3b8' : 'var(--success)')}`,
                        cursor: 'grab'
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("appointmentId", apt?.id || "");
                        e.currentTarget.style.opacity = '0.5';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAp(apt);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                          <Clock size={11} />
                          {format(new Date(apt.appointment_date), "HH:mm")}
                          {apt?.status === 'COMPLETADO' && <CheckCircle size={11} color="var(--success)" />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAp(apt);
                              setIsEditOpen(true);
                            }}
                            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            title="Mover o Editar Turno"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, marginBottom: '0.1rem', wordBreak: 'break-word' }}>{apt?.name}</p>
                      {apt.domicilio_address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0.2rem 0' }}>
                          <MapPin size={10} color="var(--text-muted)" />
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{apt.domicilio_address}</p>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>{apt?.analysis_type}</p>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {apt.google_maps_link && (
                            <a href={apt.google_maps_link} target="_blank" onClick={(e) => e.stopPropagation()} title="Abrir en Maps" style={{ display: 'flex' }}>
                              <ExternalLink size={10} color="var(--primary)" />
                            </a>
                          )}
                          {apt.observations && (
                            <span title={apt.observations} style={{ display: 'flex' }}>
                              <MessageSquare size={10} color="var(--primary)" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
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
        isDomicilio={true}
      />

      <EvolutionModal
        isOpen={selectedAp !== null}
        onClose={() => setSelectedAp(null)}
        ap={selectedAp}
      />

      <EditAppointmentModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingAp(null); }}
        ap={editingAp}
      />

      <MoveReasonModal
        isOpen={isMovingModalOpen}
        onClose={() => { setIsMovingModalOpen(false); setMovingAppt(null); }}
        apptId={movingAppt?.id || null}
        newDate={movingAppt?.targetDate || null}
      />
    </div>
  );
}
