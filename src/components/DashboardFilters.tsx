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

  function handleSearch(query: string) {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <select 
        className="input-field"
        style={{ padding: '0.45rem', height: '40px' }}
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
      <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
        <input 
          type="text" 
          placeholder="Buscar paciente o DNI..." 
          className="input-field"
          style={{ width: '100%', height: '40px', paddingRight: '2.5rem' }}
          defaultValue={searchParams.get('q')?.toString()}
          onChange={(e) => {
             handleSearch(e.target.value);
          }}
        />
        <svg style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
    </div>
  );
}
