import { getCobranzas } from "../../../src/actions/listados";
import CobranzasTable from "../../../src/components/CobranzasTable";
import ListadosNav from "../../../src/components/ListadosNav";

export const revalidate = 0;

export default async function CobranzasPage() {
    const { data, error } = await getCobranzas();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <ListadosNav />

            <section>
                {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
                <CobranzasTable data={data || []} />
            </section>
        </div>
    );
}
