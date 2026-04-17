import { getAppointments } from "@/actions/appointments";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Clock } from "lucide-react";
import MonthClientView from "@/components/MonthClientView";

export const revalidate = 0;

export default async function CalendarPage({ searchParams }: { searchParams: { date?: string } }) {
  const { data: appointments, error } = await getAppointments();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Envolvemos en un componente cliente interactivo para que puedan cambiar de mes */}
       <MonthClientView appointments={appointments || []} />
    </div>
  )
}
