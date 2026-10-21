import { getAppointments, ensureBlockedDaysTable, getBlockedDays } from "@/actions/appointments";
import DomicilioCalendarView from "@/components/DomicilioCalendarView";

export const revalidate = 0;

export default async function DomicilioCalendarPage() {
  await ensureBlockedDaysTable();
  const { data: appointments } = await getAppointments();
  const { data: blockedDays } = await getBlockedDays('domicilio');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <DomicilioCalendarView appointments={appointments || []} blockedDays={blockedDays || []} />
    </div>
  );
}
