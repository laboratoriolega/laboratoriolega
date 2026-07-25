import { getSession } from "@/lib/auth";
import IngresosPageClient from "@/components/IngresosPageClient";
import { ensureIngresosExtColumns } from "@/actions/ingresos";
import { getObrasSociales } from "@/actions/listados";
import { Suspense } from "react";

export default async function IngresosPage() {
  const session = await getSession() as any;
  const userRole: string = session?.role || 'staff';
  await ensureIngresosExtColumns();
  const osRes = await getObrasSociales();
  const obrasSociales: string[] = (osRes.data ?? [])
    .filter((os: any) => os.activo)
    .map((os: any) => os.nombre as string);
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <IngresosPageClient userRole={userRole} obrasSociales={obrasSociales} />
    </Suspense>
  );
}
