import { getAnalisisLista } from "@/actions/listados";
import AnalisisExcelTable from "@/components/AnalisisExcelTable";

export default async function AnalisisPage() {
  const { data, error } = await getAnalisisLista();

  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Análisis que sí hacemos</h2>
      <AnalisisExcelTable data={data || []} />
    </div>
  );
}
