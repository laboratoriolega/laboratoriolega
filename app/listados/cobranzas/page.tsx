import { getCobranzas, ensureCobranzasTable } from "../../../src/actions/listados";
import CobranzasTable from "../../../src/components/CobranzasTable";

export const revalidate = 0;

export default async function CobranzasPage() {
    // Ensure table exists on first visit/load
    await ensureCobranzasTable();

    const { data, error } = await getCobranzas();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
                {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
                <CobranzasTable data={data || []} />
            </section>
        </div>
    );
}
