"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search } from "lucide-react";

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
        <Search 
          style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }} 
          size={18} 
          color="var(--primary)" 
        />
      </div>
    </div>
  );
}
