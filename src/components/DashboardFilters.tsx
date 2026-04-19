"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardFilters({ currentMonth }: { currentMonth?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleMonthChange(month: string) {
    const params = new URLSearchParams(searchParams);
    if (month) {
      params.set('month', month);
    } else {
      params.delete('month');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <select 
        className="input-field"
        style={{ padding: '0.4rem' }}
        value={currentMonth || ""}
        onChange={(e) => handleMonthChange(e.target.value)}
      >
        <option value="">Todos los meses</option>
        {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
          <option key={m} value={m}>
            {format(new Date(2024, parseInt(m)-1, 1), "MMMM", { locale: es })}
          </option>
        ))}
      </select>
      <input 
        type="text" 
        placeholder="Buscar por paciente o DNI..." 
        className="input-field"
        style={{ width: '100%', maxWidth: '300px' }}
        onChange={(e) => {
           // Search logic could also be added here via query params
        }}
      />
    </div>
  );
}
