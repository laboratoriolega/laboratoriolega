import { getSystemCodes } from "@/actions/listados";
import SystemCodesTable from "@/components/SystemCodesTable";

export default async function CodigosPage() {
  const { data, error } = await getSystemCodes();

  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  return <SystemCodesTable data={data || []} />;
}
