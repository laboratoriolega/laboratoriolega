import { getPendientes } from "@/actions/listados";
import PendientesTable from "@/components/PendientesTable";

export default async function PendientesPage() {
  const { data, error } = await getPendientes();

  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  return <PendientesTable data={data || []} />;
}
