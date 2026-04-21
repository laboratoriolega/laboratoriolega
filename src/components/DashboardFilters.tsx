"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const today = format(new Date(), "yyyy-MM-dd");
  const currentDate = searchParams.get('date') || today;

  function handleDateChange(date: string) {
    const params = new URLSearchParams(searchParams);
    if (date) {
      params.set('date', date);
    } else {
      params.delete('date');
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
      <input 
        type="date"
        className="input-field"
        style={{ padding: '0.45rem', height: '40px', colorScheme: 'auto' }}
        value={currentDate}
        onChange={(e) => handleDateChange(e.target.value)}
      />
      <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
        <input 
          type="text" 
          placeholder="Buscar paciente o DNI..." 
          className="input-field"
          style={{ width: '100%', height: '40px', paddingRight: '2.5rem' }}
          defaultValue={searchParams.get('q')?.toString() || ""}
          onChange={(e) => {
             handleSearch(e.target.value);
          }}
        />
        <svg style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
    </div>
  );
}
