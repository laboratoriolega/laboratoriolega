import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ListadosPage() {
  const session = await getSession() as any;
  if (session?.username === "aviola" || session?.role === "bioquimico") {
    redirect("/listados/analisis");
  }
  redirect("/listados/pendientes");
}
