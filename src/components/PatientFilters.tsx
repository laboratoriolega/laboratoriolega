"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export default function PatientFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

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
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <input 
        type="text" 
        placeholder="Buscar paciente, DNI u Obra Social..." 
        className="input-field"
        style={{ width: '100%', height: '40px', paddingLeft: '2.5rem' }}
        defaultValue={searchParams.get('q')?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
        <Search size={18} />
      </div>
    </div>
  );
}
