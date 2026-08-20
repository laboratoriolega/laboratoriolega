import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFacturacionOS } from "@/actions/listados";
import { OBRAS_SOCIALES } from "@/lib/constants";
import FacturacionOSTable from "@/components/FacturacionOSTable";

export default async function FacturacionOSPage() {
  const session = await getSession() as any;

  if (!session) redirect("/login");

  // Fetch all obras sociales data in parallel
  const results = await Promise.all(
    (OBRAS_SOCIALES as string[]).map(os => getFacturacionOS(os))
  );

  const allData: Record<string, any[]> = {};
  (OBRAS_SOCIALES as string[]).forEach((os, i) => {
    allData[os] = results[i].data || [];
  });

  return (
    <FacturacionOSTable allData={allData} userRole={session.role} />
  );
}
