import { getPrestacionesSheets } from "../../src/actions/prestaciones";
import PrestacionesDashboard from "../../src/components/PrestacionesDashboard";

export const revalidate = 0;

export default async function PrestacionesPage() {
  const { data: sheets } = await getPrestacionesSheets();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <PrestacionesDashboard initialSheets={sheets || []} />
    </div>
  );
}
