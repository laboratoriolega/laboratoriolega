import { getCobranzas } from "../../../src/actions/listados";
import CobranzasTable from "../../../src/components/CobranzasTable";
import ListadosNav from "../../../src/components/ListadosNav";

export const revalidate = 0;

export default async function CobranzasPage() {
    const { data, error } = await getCobranzas();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Módulo de Cobranzas</h2>
                <p style={{ color: 'var(--text-muted)' }}>Seguimiento detallado de cobros y facturación a pacientes.</p>
            </header>

            <ListadosNav />

            <section>
                {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
                <CobranzasTable data={data || []} />
            </section>
        </div>
    );
}
