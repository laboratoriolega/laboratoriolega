import { getBillingPrices } from "@/actions/listados";
import BillingPricesTable from "@/components/BillingPricesTable";

export default async function PreciosPage() {
  const { data, error } = await getBillingPrices();

  if (error) return <div className="glass-panel" style={{ padding: "2rem", color: "var(--danger)" }}>Error: {error}</div>;

  return <BillingPricesTable data={data || []} />;
}
