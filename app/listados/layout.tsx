import ListadosNav from "@/components/ListadosNav";

export default function ListadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>Listados</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Gestión de pendientes, códigos y precios.</p>
      </header>

      <ListadosNav />

      <main>
        {children}
      </main>
    </div>
  );
}
