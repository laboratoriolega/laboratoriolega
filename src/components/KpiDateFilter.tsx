"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";

export default function KpiDateFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentMonthValue = format(new Date(), "yyyy-MM");
  const kpiStart = searchParams.get('kpiStart');
  const kpiEnd = searchParams.get('kpiEnd');

  const isCustom = searchParams.get('kpiCustom') === 'true';

  const [mode, setMode] = useState<'month' | 'custom'>(isCustom ? 'custom' : 'month');
  const [month, setMonth] = useState(kpiStart ? kpiStart.substring(0, 7) : currentMonthValue);
  const [start, setStart] = useState(kpiStart || format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [end, setEnd] = useState(kpiEnd || format(endOfMonth(new Date()), "yyyy-MM-dd"));

  function applyMonth(m: string) {
    setMonth(m);
    if (!m) return;
    try {
      const [year, monthNum] = m.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const s = format(startOfMonth(date), "yyyy-MM-dd");
      const e = format(endOfMonth(date), "yyyy-MM-dd");
      
      const params = new URLSearchParams(searchParams.toString());
      params.set('kpiStart', s);
      params.set('kpiEnd', e);
      params.delete('kpiCustom');
      replace(`${pathname}?${params.toString()}`);
    } catch(err) {}
  }

  function applyCustom(s: string, e: string) {
    setStart(s);
    setEnd(e);
    if (s && e) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('kpiStart', s);
      params.set('kpiEnd', e);
      params.set('kpiCustom', 'true');
      replace(`${pathname}?${params.toString()}`);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Estadísticas:</span>
      
      <select 
        value={mode} 
        onChange={(e) => {
          const newMode = e.target.value as 'month'|'custom';
          setMode(newMode);
          if (newMode === 'month') applyMonth(month);
          else applyCustom(start, end);
        }}
        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 500 }}
      >
        <option value="month">Por Mes</option>
        <option value="custom">Rango Personalizado</option>
      </select>

      {mode === 'month' ? (
        <input 
          type="month"
          value={month}
          onChange={e => applyMonth(e.target.value)}
          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 500, colorScheme: 'auto' }}
        />
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="date"
            value={start}
            onChange={e => applyCustom(e.target.value, end)}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 500, colorScheme: 'auto' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>a</span>
          <input 
            type="date"
            value={end}
            onChange={e => applyCustom(start, e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 500, colorScheme: 'auto' }}
          />
        </div>
      )}
    </div>
  );
}
