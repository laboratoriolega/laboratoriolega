import { getAppointments } from "@/actions/appointments";
import IndicacionesTable from "@/components/IndicacionesTable";

export default async function IndicacionesPage() {
  const { data, error } = await getAppointments();
  
  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  // Filter ONLY Test de aire appointments (Laboratory) and EXCLUDE Domicilio
  const filteredData = (data || []).filter((apt: any) => apt.analysis_type === 'Test de aire' && !apt.is_domicilio);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>Control de Indicaciones (WS)</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Seguimiento de envío de preparaciones exclusivo para turnos de Aire (Laboratorio).</p>
      </header>
      
      <IndicacionesTable data={filteredData} />
    </div>
  );
}
