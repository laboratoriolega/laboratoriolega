import { getNotas } from "@/actions/listados";
import NotesBoard from "@/components/NotesBoard";

export default async function NotasPage() {
  const { data, error } = await getNotas();

  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Bloc de Notas</h2>
      <NotesBoard data={data || []} />
    </div>
  );
}
