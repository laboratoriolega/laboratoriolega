import { getAppointments, ensureBlockedDaysTable, getBlockedDays } from "@/actions/appointments";
import PabCalendarView from "@/components/PabCalendarView";

export const revalidate = 0;

export default async function PabCalendarPage() {
  await ensureBlockedDaysTable();
  const { data: appointments } = await getAppointments();
  const { data: blockedDays } = await getBlockedDays();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <PabCalendarView appointments={appointments || []} blockedDays={blockedDays || []} />
    </div>
  );
}
