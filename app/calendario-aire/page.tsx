import { getAppointments } from "@/actions/appointments";
import AiresCalendarView from "@/components/AiresCalendarView";

export const revalidate = 0;

export default async function AiresCalendarPage() {
  const { data: appointments } = await getAppointments();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <AiresCalendarView appointments={appointments || []} />
    </div>
  );
}
