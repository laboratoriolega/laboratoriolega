import { getAppointments, ensureBlockedDaysTable, getBlockedDays } from "@/actions/appointments";
import MonthClientView from "@/components/MonthClientView";

export const revalidate = 0;

export default async function CalendarPage({ searchParams }: { searchParams: { date?: string } }) {
  await ensureBlockedDaysTable();
  const { data: appointments } = await getAppointments();
  const { data: blockedDays } = await getBlockedDays('general');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <MonthClientView appointments={appointments || []} blockedDays={blockedDays || []} />
    </div>
  );
}
