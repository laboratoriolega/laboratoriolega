import { getAppointments } from "@/actions/appointments";
import DomicilioCalendarView from "@/components/DomicilioCalendarView";

export const revalidate = 0;

export default async function DomicilioCalendarPage() {
  const { data: appointments } = await getAppointments();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <DomicilioCalendarView appointments={appointments || []} />
    </div>
  );
}
