"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, DollarSign, Save } from "lucide-react";
import { getIngresosPorObraSocial, updateCoseguroMasivo, updateCoseguroIndividual } from "@/actions/listados";

export default function PagoObrasocialTable() {
  const [obraSocial, setObraSocial] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [masivoTotal, setMasivoTotal] = useState("");
  const [loadingMasivo, setLoadingMasivo] = useState(false);

  async function handleSearch() {
    if (!obraSocial || !desde || !hasta) {
      alert("Por favor ingresá Obra Social, fecha desde y fecha hasta.");
      return;
    }
    setLoading(true);
    const res = await getIngresosPorObraSocial(obraSocial, desde, hasta);
    if (res.data) {
      setData(res.data);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  async function handleIndividualUpdate(id: string, monto: string) {
    const res = await updateCoseguroIndividual(id, monto);
    if (res.error) alert(res.error);
  }

  const handleMontoBlur = (id: string, e: any) => {
    handleIndividualUpdate(id, e.target.value);
  };

  async function handleCargaMasiva() {
    if (data.length === 0) return;
    const total = parseFloat(masivoTotal);
    if (isNaN(total) || total <= 0) {
      alert("Monto inválido para carga masiva.");
      return;
    }
    const montoPerUser = (total / data.length).toFixed(2);
    if (!confirm(`Se cargará $${montoPerUser} a cada uno de los ${data.length} pacientes (Total: $${total}). Se asignará TRANSFERENCIA como método de pago. ¿Continuar?`)) {
      return;
    }

    setLoadingMasivo(true);
    const ids = data.map(d => d.id);
    const res = await updateCoseguroMasivo(ids, parseFloat(montoPerUser), "TRANSFERENCIA");
    if (res.success) {
      handleSearch();
      setMasivoTotal("");
      alert("Carga masiva aplicada exitosamente.");
    } else {
      alert(res.error);
    }
    setLoadingMasivo(false);
  }

  const perUserAmount = data.length > 0 && parseFloat(masivoTotal) > 0 
    ? (parseFloat(masivoTotal) / data.length).toFixed(2) 
    : "0.00";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Obra Social</label>
          <input type="text" value={obraSocial} onChange={e => setObraSocial(e.target.value)} className="input-field" placeholder="Ej: OSDE" />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-field" />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-field" />
        </div>
        <button onClick={handleSearch} disabled={loading} className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}>
          <Search size={18} />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {data.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-gradient-end)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--primary)' }}>Carga Masiva (Coseguro)</h4>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Distribuye un monto total equitativamente entre los {data.length} pacientes listados.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="number" 
                value={masivoTotal} 
                onChange={e => setMasivoTotal(e.target.value)} 
                className="input-field" 
                placeholder="Monto Total" 
                style={{ paddingLeft: '2rem', width: '180px', fontWeight: 700 }} 
              />
            </div>
            {parseFloat(masivoTotal) > 0 && (
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                $ {perUserAmount} por paciente
              </div>
            )}
            <button onClick={handleCargaMasiva} disabled={loadingMasivo || data.length === 0} className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />
              {loadingMasivo ? 'Guardando...' : 'Guardar Masivo'}
            </button>
          </div>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Ingresá los filtros arriba y hacé clic en Buscar.
        </div>
      )}

      {data.length > 0 && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, borderBottom: '1px solid var(--glass-border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Paciente</th>
                  <th style={{ padding: '0.85rem 1rem' }}>DNI</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Obra Social</th>
                  <th style={{ padding: '0.85rem 1rem', width: '150px' }}>Coseguro O.Soc</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Medio de Pago</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                      {item.appointment_date ? format(new Date(item.appointment_date), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.92rem' }}>{item.paciente}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>{item.dni}</td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--primary)', fontWeight: 600 }}>{item.health_insurance || '—'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <input 
                        type="number" 
                        defaultValue={item.coseguro || ''} 
                        onBlur={(e) => handleMontoBlur(item.id, e)}
                        className="input-field" 
                        style={{ width: '100%', padding: '0.4rem', fontWeight: 700, color: 'var(--success)' }}
                        placeholder="0.00"
                      />
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {item.payment_method ? (
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px',
                          fontSize: '0.75rem', fontWeight: 700,
                          background: 'rgba(14,165,233,0.12)', color: 'var(--primary)', border: '1px solid rgba(14,165,233,0.25)'
                        }}>{item.payment_method}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
