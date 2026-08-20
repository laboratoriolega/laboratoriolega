import { getAnalisisLista, getAnalisisConfig } from "@/actions/listados";
import { getSession } from "@/lib/auth";
import AnalisisExcelTable from "@/components/AnalisisExcelTable";

export default async function AnalisisPage() {
  const session = await getSession() as any;
  const { data, error } = await getAnalisisLista();
  const { data: config } = await getAnalisisConfig();
  
  const canEdit = session?.role === 'admin' || session?.custom_permissions?.["listados:analisis"] === "write";

  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Análisis que sí hacemos</h2>
      <AnalisisExcelTable data={data || []} initialColumns={config?.columns || []} canEdit={canEdit} />
    </div>
  );
}
